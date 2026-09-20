import { ProjectStatus } from '../projects/entities/project.entity';

export interface ProjectStatusChangedPayload {
  projectId: string;
  projectName: string;
  previousStatus: ProjectStatus;
  newStatus: ProjectStatus;
  responsibleId: string;
  responsibleEmail: string;
  changedAt: string;
}
