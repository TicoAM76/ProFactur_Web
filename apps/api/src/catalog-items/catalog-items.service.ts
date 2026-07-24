import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCatalogItemDto } from './dto/create-catalog-item.dto';

@Injectable()
export class CatalogItemsService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeOptional(value?: string): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private async ensureCompanyExists(companyId: string): Promise<void> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });

    if (!company) {
      throw new NotFoundException('La empresa solicitada no existe.');
    }
  }

  async create(companyId: string, data: CreateCatalogItemDto) {
    await this.ensureCompanyExists(companyId);

    const unitPrice = new Prisma.Decimal(data.unitPrice);
    const taxRate = new Prisma.Decimal(data.taxRate ?? '21.00');

    if (unitPrice.isNegative()) {
      throw new BadRequestException(
        'El precio unitario no puede ser negativo.',
      );
    }

    if (taxRate.isNegative() || taxRate.greaterThan(100)) {
      throw new BadRequestException('El tipo de IVA debe estar entre 0 y 100.');
    }

    const code = this.normalizeOptional(data.code)?.toUpperCase() ?? null;

    try {
      return await this.prisma.catalogItem.create({
        data: {
          companyId,
          type: data.type,
          code,
          name: data.name.trim(),
          description: this.normalizeOptional(data.description),
          unit: this.normalizeOptional(data.unit)?.toUpperCase() ?? 'UD',
          unitPrice,
          taxRate,
          trackInventory: data.trackInventory ?? false,
          isActive: data.isActive ?? true,
        },
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Ya existe un concepto con ese código en esta empresa.',
        );
      }

      throw error;
    }
  }

  async findAll(companyId: string) {
    await this.ensureCompanyExists(companyId);

    return this.prisma.catalogItem.findMany({
      where: {
        companyId,
      },
      orderBy: [
        {
          type: 'asc',
        },
        {
          name: 'asc',
        },
      ],
    });
  }

  async findOne(companyId: string, catalogItemId: string) {
    const catalogItem = await this.prisma.catalogItem.findFirst({
      where: {
        id: catalogItemId,
        companyId,
      },
    });

    if (!catalogItem) {
      throw new NotFoundException('El concepto solicitado no existe.');
    }

    return catalogItem;
  }
}
