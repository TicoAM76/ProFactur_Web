import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CustomersService } from './customers.service';

@Controller('companies/:companyId/customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  create(
    @Param('companyId', new ParseUUIDPipe({ version: '4' }))
    companyId: string,
    @Body() data: CreateCustomerDto,
  ) {
    return this.customersService.create(companyId, data);
  }

  @Get()
  findAll(
    @Param('companyId', new ParseUUIDPipe({ version: '4' }))
    companyId: string,
  ) {
    return this.customersService.findAll(companyId);
  }

  @Get(':customerId')
  findOne(
    @Param('companyId', new ParseUUIDPipe({ version: '4' }))
    companyId: string,
    @Param('customerId', new ParseUUIDPipe({ version: '4' }))
    customerId: string,
  ) {
    return this.customersService.findOne(companyId, customerId);
  }
}
