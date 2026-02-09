import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Project } from 'src/projects/entities/project.entity';

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || process.env.PGHOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || process.env.PGPORT || '5432', 10),
  username: process.env.DATABASE_USER || process.env.PGUSER || 'postgres',
  password:
    process.env.DATABASE_PASSWORD || process.env.PGPASSWORD || 'postgres',
  database:
    process.env.DATABASE_NAME || process.env.PGDATABASE || 'heroforce_db',
  entities: [User, Project],
  synchronize: true,
  logging: process.env.NODE_ENV === 'development',
};
