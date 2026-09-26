import { Global, Module } from '@nestjs/common';
import { AuditController } from '../audit/audit.controller';
import { AuditService } from '../audit/audit.service';
import { RevalidateService } from './revalidate.service';

@Global()
@Module({
  controllers: [AuditController],
  providers: [AuditService, RevalidateService],
  exports: [AuditService, RevalidateService],
})
export class CommonModule {}
