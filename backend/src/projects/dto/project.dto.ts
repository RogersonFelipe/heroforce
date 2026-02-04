import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ProjectStatus } from '../entities/project.entity';

export class CreateProjectDto {
  @ApiProperty({
    example: 'Missão Resgate',
    description: 'Nome do projeto',
  })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string;

  @ApiProperty({
    example: 'Resgatar civis em área de risco',
    description: 'Descrição detalhada do projeto',
  })
  @IsString()
  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  description: string;

  @ApiProperty({
    enum: ProjectStatus,
    example: ProjectStatus.PENDING,
    description: 'Status do projeto',
  })
  @IsEnum(ProjectStatus, { message: 'Status inválido' })
  status: ProjectStatus;

  @ApiProperty({
    example: 80,
    minimum: 0,
    maximum: 100,
    description: 'Meta de Agilidade (0-100)',
  })
  @IsNumber()
  @Min(0, { message: 'Agilidade mínima é 0' })
  @Max(100, { message: 'Agilidade máxima é 100' })
  agilidade: number;

  @ApiProperty({
    example: 70,
    minimum: 0,
    maximum: 100,
    description: 'Meta de Encantamento (0-100)',
  })
  @IsNumber()
  @Min(0, { message: 'Encantamento mínimo é 0' })
  @Max(100, { message: 'Encantamento máximo é 100' })
  encantamento: number;

  @ApiProperty({
    example: 90,
    minimum: 0,
    maximum: 100,
    description: 'Meta de Eficiência (0-100)',
  })
  @IsNumber()
  @Min(0, { message: 'Eficiência mínima é 0' })
  @Max(100, { message: 'Eficiência máxima é 100' })
  eficiencia: number;

  @ApiProperty({
    example: 85,
    minimum: 0,
    maximum: 100,
    description: 'Meta de Excelência (0-100)',
  })
  @IsNumber()
  @Min(0, { message: 'Excelência mínima é 0' })
  @Max(100, { message: 'Excelência máxima é 100' })
  excelencia: number;

  @ApiProperty({
    example: 95,
    minimum: 0,
    maximum: 100,
    description: 'Meta de Transparência (0-100)',
  })
  @IsNumber()
  @Min(0, { message: 'Transparência mínima é 0' })
  @Max(100, { message: 'Transparência máxima é 100' })
  transparencia: number;

  @ApiProperty({
    example: 75,
    minimum: 0,
    maximum: 100,
    description: 'Meta de Ambição (0-100)',
  })
  @IsNumber()
  @Min(0, { message: 'Ambição mínima é 0' })
  @Max(100, { message: 'Ambição máxima é 100' })
  ambicao: number;

  @ApiProperty({
    example: 0,
    minimum: 0,
    maximum: 100,
    description: 'Percentual de conclusão do projeto (0-100)',
  })
  @IsNumber()
  @Min(0, { message: 'Conclusão mínima é 0' })
  @Max(100, { message: 'Conclusão máxima é 100' })
  completion: number;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'UUID do usuário responsável',
  })
  @IsUUID('4', { message: 'ID do responsável inválido' })
  @IsNotEmpty({ message: 'Responsável é obrigatório' })
  responsibleId: string;
}

export class UpdateProjectDto {
  @ApiProperty({
    example: 'Missão Resgate Atualizada',
    required: false,
    description: 'Nome do projeto',
  })
  @IsString()
  name?: string;

  @ApiProperty({
    example: 'Descrição atualizada',
    required: false,
    description: 'Descrição do projeto',
  })
  @IsString()
  description?: string;

  @ApiProperty({
    enum: ProjectStatus,
    example: ProjectStatus.IN_PROGRESS,
    required: false,
    description: 'Status do projeto',
  })
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiProperty({
    example: 85,
    minimum: 0,
    maximum: 100,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  agilidade?: number;

  @ApiProperty({
    example: 75,
    minimum: 0,
    maximum: 100,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  encantamento?: number;

  @ApiProperty({
    example: 95,
    minimum: 0,
    maximum: 100,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  eficiencia?: number;

  @ApiProperty({
    example: 90,
    minimum: 0,
    maximum: 100,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  excelencia?: number;

  @ApiProperty({
    example: 100,
    minimum: 0,
    maximum: 100,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  transparencia?: number;

  @ApiProperty({
    example: 80,
    minimum: 0,
    maximum: 100,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  ambicao?: number;

  @ApiProperty({
    example: 50,
    minimum: 0,
    maximum: 100,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  completion?: number;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID('4')
  responsibleId?: string;
}
