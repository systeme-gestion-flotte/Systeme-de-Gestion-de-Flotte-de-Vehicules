import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { AssignationsService } from './assignations.service';
import { CreateAssignationDto } from './dto/create-assignation.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('assignations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('assignations')
export class AssignationsController {
  constructor(private readonly assignationsService: AssignationsService) {}

  @Get()
  @Roles('admin', 'manager', 'technicien', 'utilisateur')
  @ApiOperation({ summary: 'Lister toutes les assignations' })
  @ApiResponse({ status: 200, description: 'Liste des assignations' })
  findAll() {
    return this.assignationsService.findAll();
  }

  @Post()
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Créer une nouvelle assignation (déclenche la Saga Kafka)' })
  @ApiResponse({ status: 201, description: 'Assignation créée, événement AssignationDemandee publié' })
  @ApiResponse({ status: 400, description: 'Permis expiré ou données invalides' })
  @ApiResponse({ status: 404, description: 'Conducteur non trouvé' })
  create(@Body() dto: CreateAssignationDto) {
    return this.assignationsService.create(dto);
  }

  @Get(':id')
  @Roles('admin', 'manager', 'technicien', 'utilisateur')
  @ApiOperation({ summary: 'Obtenir une assignation par ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Assignation trouvée' })
  @ApiResponse({ status: 404, description: 'Assignation non trouvée' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.assignationsService.findOne(id);
  }

  @Patch(':id/terminer')
  @Roles('admin', 'manager', 'technicien')
  @ApiOperation({ summary: 'Terminer une assignation' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Assignation terminée' })
  @ApiResponse({ status: 400, description: 'Statut invalide pour cette transition' })
  @ApiResponse({ status: 404, description: 'Assignation non trouvée' })
  terminer(@Param('id', ParseUUIDPipe) id: string) {
    return this.assignationsService.terminer(id);
  }

  @Patch(':id/annuler')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Annuler une assignation' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Assignation annulée' })
  @ApiResponse({ status: 400, description: 'Statut invalide pour cette transition' })
  @ApiResponse({ status: 404, description: 'Assignation non trouvée' })
  annuler(@Param('id', ParseUUIDPipe) id: string) {
    return this.assignationsService.annuler(id);
  }
}
