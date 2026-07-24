import { Transform } from 'class-transformer';
import {
  IsDecimal,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { CatalogItemType } from '../../generated/prisma/client';
import { normalizeDecimalInput } from './decimal-input.transform';

export class AddInvoiceDraftLineDto {
  @IsOptional()
  @IsUUID('4')
  catalogItemId?: string;

  @IsOptional()
  @IsEnum(CatalogItemType)
  type?: CatalogItemType;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @Transform(normalizeDecimalInput)
  @IsDecimal({
    decimal_digits: '0,3',
    force_decimal: false,
  })
  quantity!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  unit?: string;

  @IsOptional()
  @Transform(normalizeDecimalInput)
  @IsDecimal({
    decimal_digits: '0,2',
    force_decimal: false,
  })
  unitPrice?: string;

  @IsOptional()
  @Transform(normalizeDecimalInput)
  @IsDecimal({
    decimal_digits: '0,2',
    force_decimal: false,
  })
  discountRate?: string;

  @IsOptional()
  @Transform(normalizeDecimalInput)
  @IsDecimal({
    decimal_digits: '0,2',
    force_decimal: false,
  })
  taxRate?: string;
}
