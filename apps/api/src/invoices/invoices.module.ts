import { Module } from '@nestjs/common';
import { FiscalModule } from '../fiscal/fiscal.module';
import { PrismaModule } from '../prisma/prisma.module';
import { InvoicePdfService } from './invoice-pdf.service';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

@Module({
  imports: [PrismaModule, FiscalModule],
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoicePdfService],
})
export class InvoicesModule {}
