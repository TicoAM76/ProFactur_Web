import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  StreamableFile,
} from '@nestjs/common';
import { IssueInvoiceDto } from './dto/issue-invoice.dto';
import { InvoicePdfService } from './invoice-pdf.service';
import { InvoicesService } from './invoices.service';

@Controller('companies/:companyId')
export class InvoicesController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly invoicePdfService: InvoicePdfService,
  ) {}

  @Post('invoice-drafts/:draftId/issue')
  issueFromDraft(
    @Param('companyId', new ParseUUIDPipe({ version: '4' }))
    companyId: string,
    @Param('draftId', new ParseUUIDPipe({ version: '4' }))
    draftId: string,
    @Body() data: IssueInvoiceDto,
  ) {
    return this.invoicesService.issueFromDraft(companyId, draftId, data);
  }

  @Get('invoices')
  findAll(
    @Param('companyId', new ParseUUIDPipe({ version: '4' }))
    companyId: string,
  ) {
    return this.invoicesService.findAll(companyId);
  }

  @Get('invoices/:invoiceId/pdf')
  async downloadPdf(
    @Param('companyId', new ParseUUIDPipe({ version: '4' }))
    companyId: string,
    @Param('invoiceId', new ParseUUIDPipe({ version: '4' }))
    invoiceId: string,
  ): Promise<StreamableFile> {
    const pdf = await this.invoicePdfService.generate(companyId, invoiceId);

    return new StreamableFile(pdf.buffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="${pdf.fileName}"`,
      length: pdf.buffer.length,
    });
  }

  @Get('invoices/:invoiceId')
  findOne(
    @Param('companyId', new ParseUUIDPipe({ version: '4' }))
    companyId: string,
    @Param('invoiceId', new ParseUUIDPipe({ version: '4' }))
    invoiceId: string,
  ) {
    return this.invoicesService.findOne(companyId, invoiceId);
  }
}
