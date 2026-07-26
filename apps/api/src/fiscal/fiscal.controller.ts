import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  StreamableFile,
} from '@nestjs/common';
import { FiscalSubmissionsService } from './fiscal-submissions.service';
import { FiscalXmlService } from './fiscal-xml.service';

@Controller('companies/:companyId/fiscal-records')
export class FiscalController {
  constructor(
    private readonly fiscalXmlService: FiscalXmlService,
    private readonly fiscalSubmissionsService: FiscalSubmissionsService,
  ) {}

  @Get(':recordId/xml')
  async downloadAltaXml(
    @Param('companyId', new ParseUUIDPipe({ version: '4' }))
    companyId: string,
    @Param('recordId', new ParseUUIDPipe({ version: '4' }))
    recordId: string,
  ): Promise<StreamableFile> {
    const result = await this.fiscalXmlService.generateAltaXml(
      companyId,
      recordId,
    );

    const buffer = Buffer.from(result.xml, 'utf8');

    return new StreamableFile(buffer, {
      type: 'application/xml; charset=utf-8',
      disposition: `attachment; filename="${result.fileName}"`,
      length: buffer.length,
    });
  }

  @Post(':recordId/submissions/prepare')
  prepareSubmission(
    @Param('companyId', new ParseUUIDPipe({ version: '4' }))
    companyId: string,
    @Param('recordId', new ParseUUIDPipe({ version: '4' }))
    recordId: string,
  ) {
    return this.fiscalSubmissionsService.prepare(companyId, recordId);
  }
}
