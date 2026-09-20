import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AuditAction,
  AuditEntity,
  AuditLog,
  AuditLogDocument,
  FieldChange,
} from './schemas/audit-log.schema';
import { QueryAuditDto } from './dto/query-audit.dto';

export interface RecordAuditParams {
  entidade: AuditEntity;
  entidadeId: string;
  acao: AuditAction;
  usuarioId: string;
  alteracoes: Record<string, FieldChange>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectModel(AuditLog.name) private auditModel: Model<AuditLogDocument>,
  ) {}

  async record(params: RecordAuditParams): Promise<void> {
    try {
      await this.auditModel.create({
        ...params,
        ocorridoEm: new Date(),
      });
    } catch (err) {
      this.logger.warn(
        `Falha ao gravar auditoria de ${params.entidade}:${params.entidadeId}: ${(err as Error).message}`,
      );
    }
  }

  async query(filters: QueryAuditDto): Promise<AuditLog[]> {
    const where: Record<string, unknown> = {};

    if (filters.entidade) {
      where.entidade = filters.entidade;
    }

    if (filters.entidadeId) {
      where.entidadeId = filters.entidadeId;
    }

    if (filters.usuarioId) {
      where.usuarioId = filters.usuarioId;
    }

    if (filters.dataInicio || filters.dataFim) {
      const ocorridoEm: Record<string, Date> = {};
      if (filters.dataInicio) {
        ocorridoEm.$gte = new Date(filters.dataInicio);
      }
      if (filters.dataFim) {
        ocorridoEm.$lte = new Date(filters.dataFim);
      }
      where.ocorridoEm = ocorridoEm;
    }

    return this.auditModel.find(where).sort({ ocorridoEm: 1 }).lean().exec();
  }
}
