import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsISO8601, IsOptional, IsString } from 'class-validator';

export class QueryAuditDto {
  @ApiPropertyOptional({
    enum: ['project', 'user'],
    description: 'Filtrar por tipo de entidade',
  })
  @IsOptional()
  @IsIn(['project', 'user'])
  entidade?: 'project' | 'user';

  @ApiPropertyOptional({ description: 'Filtrar por id da entidade' })
  @IsOptional()
  @IsString()
  entidadeId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por quem fez a alteração' })
  @IsOptional()
  @IsString()
  usuarioId?: string;

  @ApiPropertyOptional({
    description: 'Início do período (ISO 8601)',
    example: '2026-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  dataInicio?: string;

  @ApiPropertyOptional({
    description: 'Fim do período (ISO 8601)',
    example: '2026-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsISO8601()
  dataFim?: string;
}
