import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { VehiclesService } from './vehicles.service';

@Controller('companies/:companyId')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post('customers/:customerId/vehicles')
  create(
    @Param('companyId', new ParseUUIDPipe({ version: '4' }))
    companyId: string,
    @Param('customerId', new ParseUUIDPipe({ version: '4' }))
    customerId: string,
    @Body() data: CreateVehicleDto,
  ) {
    return this.vehiclesService.create(companyId, customerId, data);
  }

  @Get('customers/:customerId/vehicles')
  findAll(
    @Param('companyId', new ParseUUIDPipe({ version: '4' }))
    companyId: string,
    @Param('customerId', new ParseUUIDPipe({ version: '4' }))
    customerId: string,
  ) {
    return this.vehiclesService.findAll(companyId, customerId);
  }

  @Get('vehicles/:vehicleId')
  findOne(
    @Param('companyId', new ParseUUIDPipe({ version: '4' }))
    companyId: string,
    @Param('vehicleId', new ParseUUIDPipe({ version: '4' }))
    vehicleId: string,
  ) {
    return this.vehiclesService.findOne(companyId, vehicleId);
  }
}
