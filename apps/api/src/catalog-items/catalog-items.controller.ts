import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { CatalogItemsService } from './catalog-items.service';
import { CreateCatalogItemDto } from './dto/create-catalog-item.dto';

@Controller('companies/:companyId/catalog-items')
export class CatalogItemsController {
  constructor(private readonly catalogItemsService: CatalogItemsService) {}

  @Post()
  create(
    @Param('companyId', new ParseUUIDPipe({ version: '4' }))
    companyId: string,
    @Body() data: CreateCatalogItemDto,
  ) {
    return this.catalogItemsService.create(companyId, data);
  }

  @Get()
  findAll(
    @Param('companyId', new ParseUUIDPipe({ version: '4' }))
    companyId: string,
  ) {
    return this.catalogItemsService.findAll(companyId);
  }

  @Get(':catalogItemId')
  findOne(
    @Param('companyId', new ParseUUIDPipe({ version: '4' }))
    companyId: string,
    @Param('catalogItemId', new ParseUUIDPipe({ version: '4' }))
    catalogItemId: string,
  ) {
    return this.catalogItemsService.findOne(companyId, catalogItemId);
  }
}
