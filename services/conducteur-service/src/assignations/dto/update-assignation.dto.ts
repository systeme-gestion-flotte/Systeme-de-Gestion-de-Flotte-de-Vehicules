import { PartialType } from '@nestjs/swagger';
import { CreateAssignationDto } from './create-assignation.dto';

export class UpdateAssignationDto extends PartialType(CreateAssignationDto) {}
