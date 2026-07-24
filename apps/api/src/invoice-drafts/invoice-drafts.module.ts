import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InvoiceDraftsController } from './invoice-drafts.controller';
import { InvoiceDraftsService } from './invoice-drafts.service';

@Module({
  imports: [PrismaModule],
  controllers: [InvoiceDraftsController],
  providers: [InvoiceDraftsService],
})
export class InvoiceDraftsModule {}
