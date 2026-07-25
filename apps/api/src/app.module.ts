import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CompaniesModule } from './companies/companies.module';
import { CustomersModule } from './customers/customers.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { CatalogItemsModule } from './catalog-items/catalog-items.module';
import { InvoiceDraftsModule } from './invoice-drafts/invoice-drafts.module';
import { InvoicesModule } from './invoices/invoices.module';

@Module({
  imports: [
    PrismaModule,
    CompaniesModule,
    CustomersModule,
    VehiclesModule,
    CatalogItemsModule,
    InvoiceDraftsModule,
    InvoicesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
