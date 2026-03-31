import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KafkaProducer } from './kafka.producer';
import { KafkaConsumer } from './kafka.consumer';
import { Assignation } from '../assignations/entities/assignation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Assignation])],
  providers: [KafkaProducer, KafkaConsumer],
  exports: [KafkaProducer],
})
export class KafkaModule {}
