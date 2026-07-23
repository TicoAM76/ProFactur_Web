import { Controller, Get } from '@nestjs/common';

interface HealthResponse {
  status: 'ok';
  service: string;
  timestamp: string;
}

@Controller('health')
export class AppController {
  @Get()
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      service: 'profactur-api',
      timestamp: new Date().toISOString(),
    };
  }
}
