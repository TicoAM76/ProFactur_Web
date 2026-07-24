import { Transform, type TransformFnParams } from 'class-transformer';
import {
  IsBoolean,
  IsDecimal,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { CatalogItemType } from '../../generated/prisma/client';

function normalizeDecimalInput({ value }: TransformFnParams): unknown {
  const rawValue: unknown = value;

  if (rawValue === null || rawValue === undefined) {
    return rawValue;
  }

  if (typeof rawValue === 'string') {
    return rawValue.trim().replace(',', '.');
  }

  if (typeof rawValue === 'number') {
    return String(rawValue);
  }

  return rawValue;
}

export class CreateCatalogItemDto {
  @IsEnum(CatalogItemType)
  type!: CatalogItemType;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  unit?: string;

  @Transform(normalizeDecimalInput)
  @IsDecimal({
    decimal_digits: '0,2',
    force_decimal: false,
  })
  unitPrice!: string;

  @IsOptional()
  @Transform(normalizeDecimalInput)
  @IsDecimal({
    decimal_digits: '0,2',
    force_decimal: false,
  })
  taxRate?: string;

  @IsOptional()
  @IsBoolean()
  trackInventory?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
