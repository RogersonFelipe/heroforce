import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { AuditService } from '../audit/audit.service';
import { diffFields } from '../audit/audit-diff.util';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private auditService: AuditService,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      select: ['id', 'name', 'email', 'character', 'role', 'createdAt'],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'name', 'email', 'character', 'role', 'createdAt'],
    });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async remove(id: string, actorId: string): Promise<void> {
    const existing = await this.findOne(id);

    const result = await this.userRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException('Usuário não encontrado');
    }

    await this.auditService.record({
      entidade: 'user',
      entidadeId: id,
      acao: 'remove',
      usuarioId: actorId,
      alteracoes: diffFields(
        {
          name: existing.name,
          email: existing.email,
          character: existing.character,
          role: existing.role,
        },
        {},
      ),
    });
  }
}
