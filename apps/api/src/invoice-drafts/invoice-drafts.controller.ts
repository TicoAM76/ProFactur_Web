import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { AddInvoiceDraftLineDto } from './dto/add-invoice-draft-line.dto';
import { CreateInvoiceDraftDto } from './dto/create-invoice-draft.dto';
import { UpdateInvoiceDraftLineDto } from './dto/update-invoice-draft-line.dto';
import { InvoiceDraftsService } from './invoice-drafts.service';

@Controller('companies/:companyId/invoice-drafts')
export class InvoiceDraftsController {
  constructor(private readonly invoiceDraftsService: InvoiceDraftsService) {}

  @Post()
  create(
    @Param('companyId', new ParseUUIDPipe({ version: '4' }))
    companyId: string,
    @Body() data: CreateInvoiceDraftDto,
  ) {
    return this.invoiceDraftsService.create(companyId, data);
  }

  @Get()
  findAll(
    @Param('companyId', new ParseUUIDPipe({ version: '4' }))
    companyId: string,
  ) {
    return this.invoiceDraftsService.findAll(companyId);
  }

  @Get(':draftId')
  findOne(
    @Param('companyId', new ParseUUIDPipe({ version: '4' }))
    companyId: string,
    @Param('draftId', new ParseUUIDPipe({ version: '4' }))
    draftId: string,
  ) {
    return this.invoiceDraftsService.findOne(companyId, draftId);
  }

  @Post(':draftId/lines')
  addLine(
    @Param('companyId', new ParseUUIDPipe({ version: '4' }))
    companyId: string,
    @Param('draftId', new ParseUUIDPipe({ version: '4' }))
    draftId: string,
    @Body() data: AddInvoiceDraftLineDto,
  ) {
    return this.invoiceDraftsService.addLine(companyId, draftId, data);
  }

  @Patch(':draftId/lines/:lineId')
  updateLine(
    @Param('companyId', new ParseUUIDPipe({ version: '4' }))
    companyId: string,
    @Param('draftId', new ParseUUIDPipe({ version: '4' }))
    draftId: string,
    @Param('lineId', new ParseUUIDPipe({ version: '4' }))
    lineId: string,
    @Body() data: UpdateInvoiceDraftLineDto,
  ) {
    return this.invoiceDraftsService.updateLine(
      companyId,
      draftId,
      lineId,
      data,
    );
  }

  @Delete(':draftId/lines/:lineId')
  deleteLine(
    @Param('companyId', new ParseUUIDPipe({ version: '4' }))
    companyId: string,
    @Param('draftId', new ParseUUIDPipe({ version: '4' }))
    draftId: string,
    @Param('lineId', new ParseUUIDPipe({ version: '4' }))
    lineId: string,
  ) {
    return this.invoiceDraftsService.deleteLine(companyId, draftId, lineId);
  }

  @Post(':draftId/ready')
  markReady(
    @Param('companyId', new ParseUUIDPipe({ version: '4' }))
    companyId: string,
    @Param('draftId', new ParseUUIDPipe({ version: '4' }))
    draftId: string,
  ) {
    return this.invoiceDraftsService.markReady(companyId, draftId);
  }
}
