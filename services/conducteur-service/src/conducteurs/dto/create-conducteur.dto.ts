import {
  IsString,
  IsEmail,
  IsArray,
  IsEnum,
  IsDateString,
  IsOptional,
  IsBoolean,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoriePermis } from '../entities/conducteur.entity';

export class CreateConducteurDto {
  @ApiPropertyOptional({ description: 'ID utilisateur Keycloak' })
  @IsOptional()
  @IsString()
  keycloakUserId?: string;

  @ApiProperty({ description: 'Nom du conducteur', example: 'Dupont' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  nom: string;

  @ApiProperty({ description: 'Prénom du conducteur', example: 'Jean' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  prenom: string;

  @ApiProperty({ description: 'Email du conducteur', example: 'jean.dupont@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Numéro de permis', example: 'AB-123456' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  numeroPermis: string;

  @ApiProperty({
    description: 'Catégories de permis',
    enum: CategoriePermis,
    isArray: true,
    example: ['B'],
  })
  @IsArray()
  @IsEnum(CategoriePermis, { each: true })
  categorie: CategoriePermis[];

  @ApiPropertyOptional({ description: 'Téléphone du conducteur', example: '0612345678' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telephone?: string;

  @ApiProperty({
    description: 'Date de validité du permis',
    example: '2028-12-31',
  })
  @IsDateString()
  dateValiditePermis: string;

  @ApiPropertyOptional({ description: 'Conducteur actif', default: true })
  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}
