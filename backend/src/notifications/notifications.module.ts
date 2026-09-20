import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsService } from './notifications.service';
import { NotificationsProcessor } from './notifications.processor';
import { NotificationsController } from './notifications.controller';
import { PROJECT_STATUS_QUEUE } from './notifications.constants';

@Module({
  imports: [BullModule.registerQueue({ name: PROJECT_STATUS_QUEUE })],
  providers: [NotificationsService, NotificationsProcessor],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
