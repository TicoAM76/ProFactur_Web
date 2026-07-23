import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCompanyDto) {
    try {
      return await this.prisma.company.create({
        data: {
          legalName: data.legalName,
          tradeName: data.tradeName,
          taxId: data.taxId.toUpperCase(),
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2,
          postalCode: data.postalCode,
          city: data.city,
          province: data.province,
          countryCode: data.countryCode?.toUpperCase() ?? 'ES',
          phone: data.phone,
          email: data.email?.toLowerCase(),
          website: data.website,
          isActive: data.isActive ?? true,
        },
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Ya existe una empresa registrada con ese NIF.',
        );
      }

      throw error;
    }
  }

  findAll() {
    return this.prisma.company.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: {
        id,
      },
    });

    if (!company) {
      throw new NotFoundException('La empresa solicitada no existe.');
    }

    return company;
  }
}
