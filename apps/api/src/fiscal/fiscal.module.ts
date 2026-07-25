import { Module } from '@nestjs/common';
import { FiscalRecordsService } from './fiscal-records.service';

@Module({
  providers: [FiscalRecordsService],
  exports: [FiscalRecordsService],
})
export class FiscalModule {}
