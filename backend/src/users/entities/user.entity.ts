import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Project } from 'src/projects/entities/project.entity';

export enum UserRole {
  ADMIN = 'admin',
  HERO = 'hero',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 100 })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ length: 100 })
  character: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.HERO,
  })
  role: UserRole;

  @OneToMany(() => Project, (project) => project.responsible)
  projects: Project[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
