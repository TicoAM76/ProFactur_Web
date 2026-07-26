import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FiscalController } from './fiscal.controller';
import { FiscalRecordsService } from './fiscal-records.service';
import { FiscalSubmissionsService } from './fiscal-submissions.service';
import { FiscalXmlService } from './fiscal-xml.service';

@Module({
  imports: [PrismaModule],
  controllers: [FiscalController],
  providers: [FiscalRecordsService, FiscalXmlService, FiscalSubmissionsService],
  exports: [FiscalRecordsService],
})
export class FiscalModule {}
