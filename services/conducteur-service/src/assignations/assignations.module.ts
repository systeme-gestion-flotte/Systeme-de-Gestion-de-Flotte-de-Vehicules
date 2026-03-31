import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssignationsController } from './assignations.controller';
import { AssignationsService } from './assignations.service';
import { Assignation } from './entities/assignation.entity';
import { ConducteursModule } from '../conducteurs/conducteurs.module';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Assignation]),
    ConducteursModule,
    KafkaModule,
  ],
  controllers: [AssignationsController],
  providers: [AssignationsService],
  exports: [AssignationsService],
})
export class AssignationsModule {}
