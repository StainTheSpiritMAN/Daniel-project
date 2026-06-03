import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminKeyGuard } from './admin-key.guard';
import { ContactService } from '../contact/contact.service';
import { ListContactQueryDto } from '../contact/dto/list-contact.dto';
import { UpdateStatusDto } from '../contact/dto/update-status.dto';

@Controller('admin/contact-messages')
@UseGuards(AdminKeyGuard)
export class AdminController {
  constructor(private readonly contactService: ContactService) {}

  @Get()
  list(@Query() query: ListContactQueryDto) {
    return this.contactService.findAll(query);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.contactService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.contactService.updateStatus(id, dto.status);
  }
}
