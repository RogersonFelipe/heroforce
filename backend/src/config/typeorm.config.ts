import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Project } from 'src/projects/entities/project.entity';

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Project],
  synchronize: true,
  logging: process.env.NODE_ENV === 'development',
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
};
console.log('DATABASE_URL:', process.env.DATABASE_URL);
