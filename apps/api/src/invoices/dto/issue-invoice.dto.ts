import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class IssueInvoiceDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(/^[A-Za-z0-9-]+$/, {
    message:
      'El codigo de serie solo puede contener letras, numeros y guiones.',
  })
  seriesCode?: string;

  @IsOptional()
  @IsDateString()
  dueAt?: string;
}
