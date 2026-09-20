import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectStatus } from './entities/project.entity';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('projects')
@Controller('projects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Criar novo projeto' })
  @ApiResponse({ status: 201, description: 'Projeto criado com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Restrito a administradores' })
  async create(
    @Body() createProjectDto: CreateProjectDto,
    @GetUser() user: User,
  ) {
    return this.projectsService.create(createProjectDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os projetos' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ProjectStatus,
    description: 'Filtrar por status',
  })
  @ApiQuery({
    name: 'responsibleId',
    required: false,
    type: String,
    description: 'Filtrar por ID do responsável',
  })
  @ApiResponse({ status: 200, description: 'Lista de projetos' })
  async findAll(
    @Query('status') status?: ProjectStatus,
    @Query('responsibleId') responsibleId?: string,
  ) {
    return this.projectsService.findAll(status, responsibleId);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Obter estatísticas dos projetos' })
  @ApiResponse({ status: 200, description: 'Estatísticas dos projetos' })
  async getStatistics() {
    return this.projectsService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter projeto por ID' })
  @ApiResponse({ status: 200, description: 'Dados do projeto' })
  @ApiResponse({ status: 404, description: 'Projeto não encontrado' })
  async findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualizar projeto' })
  @ApiResponse({ status: 200, description: 'Projeto atualizado com sucesso' })
  @ApiResponse({ status: 403, description: 'Restrito a administradores' })
  @ApiResponse({ status: 404, description: 'Projeto não encontrado' })
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @GetUser() user: User,
  ) {
    return this.projectsService.update(id, updateProjectDto, user.id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remover projeto' })
  @ApiResponse({ status: 200, description: 'Projeto removido com sucesso' })
  @ApiResponse({ status: 403, description: 'Restrito a administradores' })
  @ApiResponse({ status: 404, description: 'Projeto não encontrado' })
  async remove(@Param('id') id: string, @GetUser() user: User) {
    await this.projectsService.remove(id, user.id);
    return { message: 'Projeto removido com sucesso' };
  }
}
