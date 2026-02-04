import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Project, ProjectStatus } from './entities/project.entity';
import { Repository } from 'typeorm';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    const project = this.projectRepository.create(createProjectDto);
    return this.projectRepository.save(project);
  }

  async findAll(
    status?: ProjectStatus,
    responsibleId?: string,
  ): Promise<Project[]> {
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
    return query.getMany();
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
    Object.assign(project, updateProjectDto);
    return this.projectRepository.save(project);
  }

  async remove(id: string): Promise<void> {
    const result = await this.projectRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException('Projeto não encontrado');
    }
  }

  async getStatistics() {
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

    return {
      total,
      pending,
      inProgress,
      completed,
    };
  }
}
