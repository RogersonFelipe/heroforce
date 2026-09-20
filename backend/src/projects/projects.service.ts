import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Project, ProjectStatus } from './entities/project.entity';
import { Repository } from 'typeorm';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { RedisService } from '../redis/redis.service';
import { NotificationsService } from '../notifications/notifications.service';

const CACHE_PREFIX = 'projects';
const CACHE_TTL_SECONDS = 60;

export interface ProjectStatistics {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
}

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    private redisService: RedisService,
    private notificationsService: NotificationsService,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    const project = this.projectRepository.create(createProjectDto);
    const saved = await this.projectRepository.save(project);
    await this.invalidateCache();
    return saved;
  }

  async findAll(
    status?: ProjectStatus,
    responsibleId?: string,
  ): Promise<Project[]> {
    const cacheKey = `${CACHE_PREFIX}:list:${status ?? 'all'}:${responsibleId ?? 'all'}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as Project[];
    }

    const query = this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.responsible', 'user');

    if (status) {
      query.andWhere('project.status = :status', { status });
    }

    if (responsibleId) {
      query.andWhere('project.responsibleId = :responsibleId', {
        responsibleId,
      });
    }

    const result = await query.getMany();
    await this.redisService.set(
      cacheKey,
      JSON.stringify(result),
      CACHE_TTL_SECONDS,
    );
    return result;
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['responsible'],
    });

    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    return project;
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<Project> {
    const project = await this.findOne(id);
    const previousStatus = project.status;

    // class-transformer instancia UpdateProjectDto com todos os campos
    // declarados como propriedades próprias (mesmo os não enviados, como
    // undefined) — sem filtrar, Object.assign apagaria os campos existentes.
    const updates = this.stripUndefined(updateProjectDto);
    Object.assign(project, updates);

    const saved = await this.projectRepository.save(project);
    await this.invalidateCache();

    if (updates.status && updates.status !== previousStatus) {
      await this.publishStatusChange(saved, previousStatus);
    }

    return saved;
  }

  async remove(id: string): Promise<void> {
    const result = await this.projectRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException('Projeto não encontrado');
    }

    await this.invalidateCache();
  }

  async getStatistics(): Promise<ProjectStatistics> {
    const cacheKey = `${CACHE_PREFIX}:statistics`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as ProjectStatistics;
    }

    const total = await this.projectRepository.count();

    const pending = await this.projectRepository.count({
      where: { status: ProjectStatus.PENDING },
    });

    const inProgress = await this.projectRepository.count({
      where: { status: ProjectStatus.IN_PROGRESS },
    });

    const completed = await this.projectRepository.count({
      where: { status: ProjectStatus.COMPLETED },
    });

    const statistics = {
      total,
      pending,
      inProgress,
      completed,
    };

    await this.redisService.set(
      cacheKey,
      JSON.stringify(statistics),
      CACHE_TTL_SECONDS,
    );
    return statistics;
  }

  private async invalidateCache(): Promise<void> {
    await this.redisService.delByPattern(`${CACHE_PREFIX}:*`);
  }

  private stripUndefined<T extends object>(obj: T): Partial<T> {
    return Object.fromEntries(
      Object.entries(obj).filter(([, value]) => value !== undefined),
    ) as Partial<T>;
  }

  private async publishStatusChange(
    project: Project,
    previousStatus: ProjectStatus,
  ): Promise<void> {
    try {
      await this.notificationsService.notifyStatusChange({
        projectId: project.id,
        projectName: project.name,
        previousStatus,
        newStatus: project.status,
        responsibleId: project.responsibleId,
        responsibleEmail: project.responsible?.email ?? '',
        changedAt: new Date().toISOString(),
      });
    } catch (err) {
      this.logger.warn(
        `Falha ao enfileirar notificação de mudança de status: ${(err as Error).message}`,
      );
    }
  }
}
