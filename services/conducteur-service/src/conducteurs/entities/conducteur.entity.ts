import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Assignation } from '../../assignations/entities/assignation.entity';

export enum CategoriePermis {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
}

@Entity('conducteur')
export class Conducteur {
  @PrimaryGeneratedColumn('uuid', { name: 'id_conducteur' })
  idConducteur: string;

  @Column({ name: 'keycloak_user_id', unique: true, nullable: true })
  keycloakUserId: string;

  @Column({ length: 100 })
  nom: string;

  @Column({ length: 100 })
  prenom: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'numero_permis', length: 50, unique: true })
  numeroPermis: string;

  @Column({
    type: 'enum',
    enum: CategoriePermis,
    array: true,
    name: 'categorie',
  })
  categorie: CategoriePermis[];

  @Column({ type: 'date', name: 'date_validite_permis' })
  dateValiditePermis: Date;

  @Column({ default: true })
  actif: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => Assignation, (assignation) => assignation.conducteur)
  assignations: Assignation[];
}
