import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CatalogItemType,
  InvoiceDraftStatus,
  Prisma,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AddInvoiceDraftLineDto } from './dto/add-invoice-draft-line.dto';
import { CreateInvoiceDraftDto } from './dto/create-invoice-draft.dto';
import { calculateInvoiceLine } from './invoice-line-calculator';

@Injectable()
export class InvoiceDraftsService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeOptional(value?: string): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private async validateCustomerAndVehicle(
    companyId: string,
    customerId: string,
    vehicleId?: string,
  ): Promise<void> {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        companyId,
      },
      select: {
        id: true,
      },
    });

    if (!customer) {
      throw new NotFoundException(
        'El cliente no existe o no pertenece a esta empresa.',
      );
    }

    if (!vehicleId) {
      return;
    }

    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        companyId,
        customerId,
      },
      select: {
        id: true,
      },
    });

    if (!vehicle) {
      throw new NotFoundException(
        'El vehículo no existe o no pertenece al cliente indicado.',
      );
    }
  }

  async create(companyId: string, data: CreateInvoiceDraftDto) {
    await this.validateCustomerAndVehicle(
      companyId,
      data.customerId,
      data.vehicleId,
    );

    return this.prisma.invoiceDraft.create({
      data: {
        companyId,
        customerId: data.customerId,
        vehicleId: data.vehicleId,
        currencyCode: data.currencyCode?.trim().toUpperCase() ?? 'EUR',
        notes: this.normalizeOptional(data.notes),
      },
      include: {
        customer: true,
        vehicle: true,
        lines: true,
      },
    });
  }

  findAll(companyId: string) {
    return this.prisma.invoiceDraft.findMany({
      where: {
        companyId,
      },
      include: {
        customer: true,
        vehicle: true,
        _count: {
          select: {
            lines: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(companyId: string, draftId: string) {
    const draft = await this.prisma.invoiceDraft.findFirst({
      where: {
        id: draftId,
        companyId,
      },
      include: {
        customer: true,
        vehicle: true,
        lines: {
          orderBy: {
            position: 'asc',
          },
        },
      },
    });

    if (!draft) {
      throw new NotFoundException('El borrador de factura no existe.');
    }

    return draft;
  }

  async addLine(
    companyId: string,
    draftId: string,
    data: AddInvoiceDraftLineDto,
  ) {
    const draft = await this.prisma.invoiceDraft.findFirst({
      where: {
        id: draftId,
        companyId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!draft) {
      throw new NotFoundException('El borrador de factura no existe.');
    }

    if (draft.status !== InvoiceDraftStatus.DRAFT) {
      throw new BadRequestException(
        'Solo se pueden modificar borradores en estado DRAFT.',
      );
    }

    const catalogItem = data.catalogItemId
      ? await this.prisma.catalogItem.findFirst({
          where: {
            id: data.catalogItemId,
            companyId,
            isActive: true,
          },
        })
      : null;

    if (data.catalogItemId && !catalogItem) {
      throw new NotFoundException(
        'El concepto del catálogo no existe o está inactivo.',
      );
    }

    const type: CatalogItemType | undefined = catalogItem?.type ?? data.type;

    const description =
      catalogItem?.name ?? this.normalizeOptional(data.description);

    const unit =
      catalogItem?.unit ?? this.normalizeOptional(data.unit)?.toUpperCase();

    const unitPriceValue =
      catalogItem?.unitPrice ??
      (data.unitPrice !== undefined
        ? new Prisma.Decimal(data.unitPrice)
        : undefined);

    const taxRateValue =
      catalogItem?.taxRate ??
      (data.taxRate !== undefined
        ? new Prisma.Decimal(data.taxRate)
        : undefined);

    if (
      !type ||
      !description ||
      !unit ||
      unitPriceValue === undefined ||
      taxRateValue === undefined
    ) {
      throw new BadRequestException(
        'Una línea manual requiere tipo, descripción, unidad, precio e IVA.',
      );
    }

    const quantity = new Prisma.Decimal(data.quantity);
    const discountRate = new Prisma.Decimal(data.discountRate ?? '0.00');

    const calculated = calculateInvoiceLine({
      quantity,
      unitPrice: unitPriceValue,
      discountRate,
      taxRate: taxRateValue,
    });

    const lastLine = await this.prisma.invoiceDraftLine.findFirst({
      where: {
        invoiceDraftId: draftId,
      },
      select: {
        position: true,
      },
      orderBy: {
        position: 'desc',
      },
    });

    const position = (lastLine?.position ?? 0) + 1;

    await this.prisma.$transaction(async (transaction) => {
      await transaction.invoiceDraftLine.create({
        data: {
          invoiceDraftId: draftId,
          catalogItemId: catalogItem?.id,
          position,
          type,
          code:
            catalogItem?.code ??
            this.normalizeOptional(data.code)?.toUpperCase(),
          description,
          quantity,
          unit,
          unitPrice: unitPriceValue,
          discountRate,
          taxRate: taxRateValue,
          netAmount: calculated.netAmount,
          taxAmount: calculated.taxAmount,
          totalAmount: calculated.totalAmount,
        },
      });

      const totals = await transaction.invoiceDraftLine.aggregate({
        where: {
          invoiceDraftId: draftId,
        },
        _sum: {
          netAmount: true,
          taxAmount: true,
          totalAmount: true,
        },
      });

      await transaction.invoiceDraft.update({
        where: {
          id: draftId,
        },
        data: {
          subtotal: totals._sum.netAmount ?? new Prisma.Decimal(0),
          taxAmount: totals._sum.taxAmount ?? new Prisma.Decimal(0),
          totalAmount: totals._sum.totalAmount ?? new Prisma.Decimal(0),
        },
      });
    });

    return this.findOne(companyId, draftId);
  }
}
