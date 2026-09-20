import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { NotificationsService } from './notifications.service';
import {
  NOTIFICATION_MAX_ATTEMPTS,
  PROJECT_STATUS_QUEUE,
} from './notifications.constants';
import { ProjectStatus } from '../projects/entities/project.entity';

const createMockQueue = () => ({
  add: jest.fn(),
  getJobs: jest.fn(),
  getJob: jest.fn(),
});

describe('NotificationsService', () => {
  let service: NotificationsService;
  let queue: ReturnType<typeof createMockQueue>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getQueueToken(PROJECT_STATUS_QUEUE),
          useValue: createMockQueue(),
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    queue = module.get(getQueueToken(PROJECT_STATUS_QUEUE));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('notifyStatusChange', () => {
    it('publica o job com retry de 3 tentativas e backoff exponencial', async () => {
      const payload = {
        projectId: 'project-1',
        projectName: 'Missão Resgate',
        previousStatus: ProjectStatus.PENDING,
        newStatus: ProjectStatus.IN_PROGRESS,
        responsibleId: 'user-1',
        responsibleEmail: 'user@dc.com',
        changedAt: new Date().toISOString(),
      };

      await service.notifyStatusChange(payload);

      expect(queue.add).toHaveBeenCalledWith(
        'status-changed',
        payload,
        expect.objectContaining({
          attempts: NOTIFICATION_MAX_ATTEMPTS,
          backoff: { type: 'exponential', delay: 2000 },
        }),
      );
    });
  });

  describe('listDeadLetter', () => {
    it('lista os jobs que esgotaram as tentativas', async () => {
      queue.getJobs.mockResolvedValue([
        {
          id: 'job-1',
          data: { projectId: 'project-1' },
          attemptsMade: 3,
          failedReason: 'timeout',
          finishedOn: 1700000000000,
        },
      ]);

      const result = await service.listDeadLetter();

      expect(queue.getJobs).toHaveBeenCalledWith(['failed']);
      expect(result).toEqual([
        {
          id: 'job-1',
          data: { projectId: 'project-1' },
          attemptsMade: 3,
          failedReason: 'timeout',
          failedAt: new Date(1700000000000).toISOString(),
        },
      ]);
    });
  });

  describe('reprocess', () => {
    it('reenvia o job para a fila quando ele existe', async () => {
      const retry = jest.fn().mockResolvedValue(undefined);
      queue.getJob.mockResolvedValue({ id: 'job-1', retry });

      await service.reprocess('job-1');

      expect(retry).toHaveBeenCalled();
    });

    it('lança NotFoundException quando o job não existe', async () => {
      queue.getJob.mockResolvedValue(null);

      await expect(service.reprocess('nao-existe')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
