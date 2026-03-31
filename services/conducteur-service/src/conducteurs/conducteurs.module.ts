import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConducteursController } from './conducteurs.controller';
import { ConducteursService } from './conducteurs.service';
import { Conducteur } from './entities/conducteur.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Conducteur])],
  controllers: [ConducteursController],
  providers: [ConducteursService],
  exports: [ConducteursService],
})
export class ConducteursModule {}
