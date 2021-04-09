import { Module } from '@nestjs/common';
import { InstitutionResolver } from './institution.resolver';
import { InstitutionService } from './institution.service';

@Module({
  providers: [InstitutionService, InstitutionResolver],
  exports: [InstitutionService],
})
export class InstitutionModule {}
