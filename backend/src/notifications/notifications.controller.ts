import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get('dead-letter')
  @ApiOperation({
    summary: 'Listar notificações que esgotaram as tentativas',
  })
  @ApiResponse({ status: 200, description: 'Itens na fila morta' })
  @ApiResponse({ status: 403, description: 'Restrito a administradores' })
  async listDeadLetter() {
    return this.notificationsService.listDeadLetter();
  }

  @Post('dead-letter/:id/reprocess')
  @ApiOperation({ summary: 'Reprocessar manualmente um item da fila morta' })
  @ApiResponse({ status: 200, description: 'Item reenviado para a fila' })
  @ApiResponse({ status: 404, description: 'Item não encontrado' })
  async reprocess(@Param('id') id: string) {
    await this.notificationsService.reprocess(id);
    return { message: 'Item reenviado para processamento' };
  }
}
