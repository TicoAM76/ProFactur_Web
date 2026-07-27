import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DemoDocumentPdfService } from './demo-document-pdf.service';
import {
  DemoDocumentsController,
  DemoVerificationController,
} from './demo-documents.controller';
import { DemoDocumentsService } from './demo-documents.service';

@Module({
  imports: [PrismaModule],
  controllers: [DemoDocumentsController, DemoVerificationController],
  providers: [DemoDocumentsService, DemoDocumentPdfService],
})
export class DemoDocumentsModule {}
