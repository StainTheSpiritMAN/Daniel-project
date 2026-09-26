import { Controller, Get, Query } from '@nestjs/common';
import { Auth } from '../auth/auth.decorators';
import { PageQueryDto } from '../common/page-query.dto';
import { AuditService } from './audit.service';

@Controller('admin/audit')
@Auth('ADMIN')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  list(@Query() query: PageQueryDto) {
    return this.audit.list(query.skip, query.take);
  }
}
