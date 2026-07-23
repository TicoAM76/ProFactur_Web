import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CompaniesModule } from './companies/companies.module';

@Module({
  imports: [PrismaModule, CompaniesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
