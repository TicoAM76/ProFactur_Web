import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeOptional(value?: string): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private normalizeRegistrationNumber(value: string): string {
    return value
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, '');
  }

  private async ensureCustomerBelongsToCompany(
    companyId: string,
    customerId: string,
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
  }

  async create(companyId: string, customerId: string, data: CreateVehicleDto) {
    await this.ensureCustomerBelongsToCompany(companyId, customerId);

    const registrationNumber = this.normalizeRegistrationNumber(
      data.registrationNumber,
    );

    const vin = this.normalizeOptional(data.vin)?.toUpperCase() ?? null;

    try {
      return await this.prisma.vehicle.create({
        data: {
          companyId,
          customerId,
          registrationNumber,
          brand: data.brand.trim(),
          model: data.model.trim(),
          version: this.normalizeOptional(data.version),
          vin,
          currentMileage: data.currentMileage,
          notes: this.normalizeOptional(data.notes),
          isActive: data.isActive ?? true,
        },
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const target = error.meta?.target;
        const fields = Array.isArray(target) ? target.map(String) : [];

        if (fields.includes('registrationNumber')) {
          throw new ConflictException(
            'Ya existe un vehículo con esa matrícula en esta empresa.',
          );
        }

        if (fields.includes('vin')) {
          throw new ConflictException(
            'Ya existe un vehículo con ese número de bastidor en esta empresa.',
          );
        }

        throw new ConflictException('Ya existe un vehículo con esos datos.');
      }

      throw error;
    }
  }

  async findAll(companyId: string, customerId: string) {
    await this.ensureCustomerBelongsToCompany(companyId, customerId);

    return this.prisma.vehicle.findMany({
      where: {
        companyId,
        customerId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(companyId: string, vehicleId: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        companyId,
      },
    });

    if (!vehicle) {
      throw new NotFoundException('El vehículo solicitado no existe.');
    }

    return vehicle;
  }
}
