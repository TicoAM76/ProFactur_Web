import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  StreamableFile,
} from '@nestjs/common';
import { DemoDocumentPdfService } from './demo-document-pdf.service';
import { DemoDocumentsService } from './demo-documents.service';

@Controller('companies/:companyId')
export class DemoDocumentsController {
  constructor(
    private readonly demoDocumentsService: DemoDocumentsService,
    private readonly demoDocumentPdfService: DemoDocumentPdfService,
  ) {}

  @Post('invoice-drafts/:draftId/demo-document')
  createFromDraft(
    @Param('companyId', new ParseUUIDPipe({ version: '4' }))
    companyId: string,
    @Param('draftId', new ParseUUIDPipe({ version: '4' }))
    draftId: string,
  ) {
    return this.demoDocumentsService.createFromDraft(companyId, draftId);
  }

  @Get('demo-documents')
  findAll(
    @Param('companyId', new ParseUUIDPipe({ version: '4' }))
    companyId: string,
  ) {
    return this.demoDocumentsService.findAll(companyId);
  }

  @Get('demo-documents/:documentId/pdf')
  async downloadPdf(
    @Param('companyId', new ParseUUIDPipe({ version: '4' }))
    companyId: string,
    @Param('documentId', new ParseUUIDPipe({ version: '4' }))
    documentId: string,
  ): Promise<StreamableFile> {
    const pdf = await this.demoDocumentPdfService.generate(
      companyId,
      documentId,
    );

    return new StreamableFile(pdf.buffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="${pdf.fileName}"`,
      length: pdf.buffer.length,
    });
  }

  @Get('demo-documents/:documentId/xml')
  async downloadXml(
    @Param('companyId', new ParseUUIDPipe({ version: '4' }))
    companyId: string,
    @Param('documentId', new ParseUUIDPipe({ version: '4' }))
    documentId: string,
  ): Promise<StreamableFile> {
    const document = await this.demoDocumentsService.findOne(
      companyId,
      documentId,
    );

    const xml = Buffer.from(document.xmlPreview, 'utf8');
    const safeNumber = document.fullNumber.replace(/[^A-Za-z0-9_-]/g, '_');

    return new StreamableFile(xml, {
      type: 'application/xml; charset=utf-8',
      disposition: `attachment; filename="${safeNumber}.xml"`,
      length: xml.length,
    });
  }

  @Get('demo-documents/:documentId/readiness')
  getReadiness(
    @Param('companyId', new ParseUUIDPipe({ version: '4' }))
    companyId: string,
    @Param('documentId', new ParseUUIDPipe({ version: '4' }))
    documentId: string,
  ) {
    return this.demoDocumentsService.getReadiness(companyId, documentId);
  }

  @Get('demo-documents/:documentId')
  findOne(
    @Param('companyId', new ParseUUIDPipe({ version: '4' }))
    companyId: string,
    @Param('documentId', new ParseUUIDPipe({ version: '4' }))
    documentId: string,
  ) {
    return this.demoDocumentsService.findOne(companyId, documentId);
  }
}

@Controller('demo')
export class DemoVerificationController {
  constructor(private readonly demoDocumentsService: DemoDocumentsService) {}

  @Get('verify/:qrToken')
  verify(@Param('qrToken') qrToken: string) {
    return this.demoDocumentsService.verifyByToken(qrToken);
  }
}
