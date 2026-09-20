import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  NOTIFICATION_MAX_ATTEMPTS,
  PROJECT_STATUS_QUEUE,
} from './notifications.constants';
import { ProjectStatusChangedPayload } from './notifications.types';

export interface DeadLetterItem {
  id: string;
  data: ProjectStatusChangedPayload;
  attemptsMade: number;
  failedReason: string;
  failedAt: string | null;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectQueue(PROJECT_STATUS_QUEUE) private readonly queue: Queue,
  ) {}

  async notifyStatusChange(
    payload: ProjectStatusChangedPayload,
  ): Promise<void> {
    await this.queue.add('status-changed', payload, {
      attempts: NOTIFICATION_MAX_ATTEMPTS,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
    });
  }

  async listDeadLetter(): Promise<DeadLetterItem[]> {
    const jobs = await this.queue.getJobs(['failed']);

    return jobs.map((job) => ({
      id: job.id ?? '',
      data: job.data as ProjectStatusChangedPayload,
      attemptsMade: job.attemptsMade,
      failedReason: job.failedReason,
      failedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
    }));
  }

  async reprocess(jobId: string): Promise<void> {
    const job = await this.queue.getJob(jobId);

    if (!job) {
      throw new NotFoundException('Item não encontrado na fila morta');
    }

    this.logger.log(`Reprocessando manualmente o job ${jobId}`);
    await job.retry();
  }
}
