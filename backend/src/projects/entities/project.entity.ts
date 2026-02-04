import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ProjectStatus {
  PENDING = 'pendente',
  IN_PROGRESS = 'em andamento',
  COMPLETED = 'concluído',
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.PENDING,
  })
  status: ProjectStatus;

  @Column('int', { default: 0 })
  agilidade: number;

  @Column('int', { default: 0 })
  encantamento: number;

  @Column('int', { default: 0 })
  eficiencia: number;

  @Column('int', { default: 0 })
  excelencia: number;

  @Column('int', { default: 0 })
  transparencia: number;

  @Column('int', { default: 0 })
  ambicao: number;

  @Column('int', { default: 0 })
  completion: number;

  // Relacionamento com User
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'responsibleId' })
  responsible: User;

  @Column()
  responsibleId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
