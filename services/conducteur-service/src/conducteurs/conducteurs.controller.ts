import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
import { ConducteursService } from './conducteurs.service';
import { CreateConducteurDto } from './dto/create-conducteur.dto';
import { UpdateConducteurDto } from './dto/update-conducteur.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('conducteurs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('conducteurs')
export class ConducteursController {
  constructor(private readonly conducteursService: ConducteursService) {}

  @Get()
  @Roles('admin', 'manager', 'technicien', 'utilisateur')
  @ApiOperation({ summary: 'Lister tous les conducteurs actifs' })
  @ApiResponse({ status: 200, description: 'Liste des conducteurs' })
  findAll() {
    return this.conducteursService.findAll();
  }

  @Post()
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Créer un nouveau conducteur' })
  @ApiResponse({ status: 201, description: 'Conducteur créé' })
  @ApiResponse({ status: 409, description: 'Email ou numéro de permis déjà utilisé' })
  create(@Body() dto: CreateConducteurDto) {
    return this.conducteursService.create(dto);
  }

  @Get(':id')
  @Roles('admin', 'manager', 'technicien', 'utilisateur')
  @ApiOperation({ summary: 'Obtenir un conducteur par ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Conducteur trouvé' })
  @ApiResponse({ status: 404, description: 'Conducteur non trouvé' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.conducteursService.findOne(id);
  }

  @Put(':id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Mettre à jour un conducteur' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Conducteur mis à jour' })
  @ApiResponse({ status: 404, description: 'Conducteur non trouvé' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateConducteurDto,
  ) {
    return this.conducteursService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Désactiver un conducteur (soft delete)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Conducteur désactivé' })
  @ApiResponse({ status: 404, description: 'Conducteur non trouvé' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.conducteursService.remove(id);
  }

  @Get(':id/permis/valider')
  @Roles('admin', 'manager', 'technicien')
  @ApiOperation({ summary: 'Valider le permis de conduire d\'un conducteur' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Résultat de validation du permis' })
  @ApiResponse({ status: 404, description: 'Conducteur non trouvé' })
  validerPermis(@Param('id', ParseUUIDPipe) id: string) {
    return this.conducteursService.validerPermis(id);
  }

  @Get(':id/assignations')
  @Roles('admin', 'manager', 'technicien', 'utilisateur')
  @ApiOperation({ summary: 'Obtenir les assignations d\'un conducteur' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Assignations du conducteur' })
  @ApiResponse({ status: 404, description: 'Conducteur non trouvé' })
  findAssignations(@Param('id', ParseUUIDPipe) id: string) {
    return this.conducteursService.findAssignations(id);
  }
}
