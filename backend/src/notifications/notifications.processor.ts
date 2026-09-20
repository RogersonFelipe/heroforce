import { Logger } from '@nestjs/common';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PROJECT_STATUS_QUEUE } from './notifications.constants';
import { ProjectStatusChangedPayload } from './notifications.types';

@Processor(PROJECT_STATUS_QUEUE)
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  process(job: Job<ProjectStatusChangedPayload>): Promise<void> {
    const { projectName, previousStatus, newStatus, responsibleEmail } =
      job.data;

    this.logger.log(
      `Notificando ${responsibleEmail || 'responsável'}: projeto "${projectName}" mudou de "${previousStatus}" para "${newStatus}" ` +
        `(tentativa ${job.attemptsMade + 1}/${job.opts.attempts})`,
    );

    return Promise.resolve();
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<ProjectStatusChangedPayload> | undefined, error: Error) {
    if (!job) return;

    this.logger.warn(
      `Falha ao notificar projeto ${job.data.projectId} ` +
        `(tentativa ${job.attemptsMade}/${job.opts.attempts}): ${error.message}`,
    );
  }
}
