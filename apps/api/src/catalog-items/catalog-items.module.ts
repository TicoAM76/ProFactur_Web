import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CatalogItemsController } from './catalog-items.controller';
import { CatalogItemsService } from './catalog-items.service';

@Module({
  imports: [PrismaModule],
  controllers: [CatalogItemsController],
  providers: [CatalogItemsService],
})
export class CatalogItemsModule {}
