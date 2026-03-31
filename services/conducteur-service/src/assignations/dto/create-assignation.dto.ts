import {
  IsUUID,
  IsDateString,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatutAssignation } from '../entities/assignation.entity';

export class CreateAssignationDto {
  @ApiProperty({ description: 'ID du véhicule', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  vehiculeId: string;

  @ApiProperty({ description: 'ID du conducteur', example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  conducteurId: string;

  @ApiProperty({ description: 'Date de départ', example: '2026-04-01T08:00:00Z' })
  @IsDateString()
  dateDepart: string;

  @ApiPropertyOptional({ description: 'Date de retour prévue', example: '2026-04-05T18:00:00Z' })
  @IsOptional()
  @IsDateString()
  dateRetour?: string;

  @ApiPropertyOptional({
    description: 'Statut de l\'assignation',
    enum: StatutAssignation,
    default: StatutAssignation.EN_COURS,
  })
  @IsOptional()
  @IsEnum(StatutAssignation)
  statut?: StatutAssignation;
}
