import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @MaxLength(200)
  legalName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  tradeName?: string;

  @IsString()
  @MaxLength(20)
  taxId!: string;

  @IsString()
  @MaxLength(250)
  addressLine1!: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  addressLine2?: string;

  @IsString()
  @Length(5, 10)
  postalCode!: string;

  @IsString()
  @MaxLength(100)
  city!: string;

  @IsString()
  @MaxLength(100)
  province!: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  countryCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  website?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
