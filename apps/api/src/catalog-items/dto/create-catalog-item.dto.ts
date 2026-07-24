import { Transform } from 'class-transformer';
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

  @Transform(({ value }) =>
    value == null ? value : String(value).trim().replace(',', '.'),
  )
  @IsDecimal({
    decimal_digits: '0,2',
    force_decimal: false,
  })
  unitPrice!: string;

  @IsOptional()
  @Transform(({ value }) =>
    value == null ? value : String(value).trim().replace(',', '.'),
  )
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
