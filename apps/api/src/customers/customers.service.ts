import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomersService {
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

  async create(companyId: string, data: CreateCustomerDto) {
    await this.ensureCompanyExists(companyId);

    const taxId = this.normalizeOptional(data.taxId);

    try {
      return await this.prisma.customer.create({
        data: {
          companyId,
          type: data.type,
          legalName: data.legalName.trim(),
          tradeName: this.normalizeOptional(data.tradeName),
          taxId: taxId?.toUpperCase() ?? null,
          addressLine1: this.normalizeOptional(data.addressLine1),
          addressLine2: this.normalizeOptional(data.addressLine2),
          postalCode: this.normalizeOptional(data.postalCode),
          city: this.normalizeOptional(data.city),
          province: this.normalizeOptional(data.province),
          countryCode: data.countryCode?.trim().toUpperCase() || 'ES',
          phone: this.normalizeOptional(data.phone),
          email: this.normalizeOptional(data.email)?.toLowerCase() ?? null,
          notes: this.normalizeOptional(data.notes),
          isActive: data.isActive ?? true,
        },
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Ya existe un cliente con ese NIF dentro de esta empresa.',
        );
      }

      throw error;
    }
  }

  async findAll(companyId: string) {
    await this.ensureCompanyExists(companyId);

    return this.prisma.customer.findMany({
      where: {
        companyId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(companyId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        companyId,
      },
    });

    if (!customer) {
      throw new NotFoundException('El cliente solicitado no existe.');
    }

    return customer;
  }
}
