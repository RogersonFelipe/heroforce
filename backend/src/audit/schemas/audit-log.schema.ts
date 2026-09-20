import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AuditEntity = 'project' | 'user';
export type AuditAction = 'create' | 'update' | 'remove';

export interface FieldChange {
  de: unknown;
  para: unknown;
}

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({ collection: 'audit_logs' })
export class AuditLog {
  @Prop({ required: true, index: true })
  entidade: AuditEntity;

  @Prop({ required: true, index: true })
  entidadeId: string;

  @Prop({ required: true })
  acao: AuditAction;

  @Prop({ required: true, index: true })
  usuarioId: string;

  @Prop({ type: Object, default: {} })
  alteracoes: Record<string, FieldChange>;

  @Prop({ required: true, index: true })
  ocorridoEm: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
