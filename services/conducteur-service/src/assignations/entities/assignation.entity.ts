import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Check,
} from 'typeorm';
import { Conducteur } from '../../conducteurs/entities/conducteur.entity';

export enum StatutAssignation {
  PLANIFIEE = 'planifiee',
  EN_COURS = 'en_cours',
  TERMINEE = 'terminee',
  ANNULEE = 'annulee',
}

@Entity('assignation')
@Check(`"date_retour" IS NULL OR "date_retour" > "date_depart"`)
export class Assignation {
  @PrimaryGeneratedColumn('uuid', { name: 'id_assignation' })
  idAssignation: string;

  @Column({ name: 'vehicule_id', type: 'uuid' })
  vehiculeId: string;

  @Column({ name: 'conducteur_id', type: 'uuid', nullable: true })
  conducteurId: string;

  @Column({ name: 'date_depart', type: 'timestamptz' })
  dateDepart: Date;

  @Column({ name: 'date_retour', type: 'timestamptz', nullable: true })
  dateRetour: Date;

  @Column({
    type: 'enum',
    enum: StatutAssignation,
    default: StatutAssignation.EN_COURS,
  })
  statut: StatutAssignation;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => Conducteur, (conducteur) => conducteur.assignations)
  @JoinColumn({ name: 'conducteur_id' })
  conducteur: Conducteur;
}
