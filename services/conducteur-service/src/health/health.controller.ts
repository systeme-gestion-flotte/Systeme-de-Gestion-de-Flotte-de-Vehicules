import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Health check (liveness probe)' })
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Health check détaillé' })
  @HealthCheck()
  healthDetailed() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }
}
