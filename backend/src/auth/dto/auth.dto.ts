import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsEnum,
} from 'class-validator';

export const UserRole = {
  HERO: 'hero',
  ADMIN: 'admin',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export class CreateUserDto {
  @ApiProperty({
    example: 'Bruce Wayne',
    description: 'Nome Completo do Heroi',
  })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string;

  @ApiProperty({
    example: 'bruce@hotmail.com',
    description: 'Email do heroi',
  })
  @IsEmail({}, { message: 'Email invalido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @ApiProperty({
    example: 'Homem de Ferro',
    description: 'Personagem favorito (Marvel, DC, etc)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Personagem é obrigatório' })
  character: string;

  @ApiProperty({
    example: 'senha',
    description: 'Senha (mínimo 6 caracteres)',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'Senha deve ter no minimo 6 caracteres' })
  password: string;

  @ApiProperty({
    example: 'hero',
    description: 'Role do usuário (hero ou admin)',
    enum: ['hero', 'admin'],
  })
  @IsEnum(['hero', 'admin'], { message: 'Role deve ser hero ou admin' })
  role: UserRole;
}

export class LoginDto {
  @ApiProperty({
    example: 'bruce@hotmail.com',
    description: 'Email do herói',
  })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Senha do herói',
  })
  @IsString()
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  password: string;
}
