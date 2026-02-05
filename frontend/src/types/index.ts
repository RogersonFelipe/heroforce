export const ProjectStatus = {
  PENDING: 'pendente',
  IN_PROGRESS: 'em andamento',
  COMPLETED: 'concluído',
} as const;

export type ProjectStatus = typeof ProjectStatus[keyof typeof ProjectStatus];

export type UserRole = 'admin' | 'hero';

export interface User {
  id: string;
  name: string;
  email: string;
  character: string;
  role: UserRole;
  createdAt?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  agilidade: number;
  encantamento: number;
  eficiencia: number;
  excelencia: number;
  transparencia: number;
  ambicao: number;
  completion: number;
  responsible: User;
  responsibleId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface CreateProjectDto {
  name: string;
  description: string;
  status: ProjectStatus;
  agilidade: number;
  encantamento: number;
  eficiencia: number;
  excelencia: number;
  transparencia: number;
  ambicao: number;
  completion: number;
  responsibleId: string;
}

export type UpdateProjectDto = Partial<CreateProjectDto>

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  character: string;
  password: string;
}