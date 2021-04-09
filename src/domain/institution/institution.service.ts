import { Injectable } from '@nestjs/common';
import { cached } from '../../utils/decorators/cached';
import { InstitutionRepository } from './institution.repository';

@Injectable()
export class InstitutionService {
  constructor(private institutionRepository: InstitutionRepository) {}

  @cached({ redisTtl: 60_000 * 5 })
  async findById(id: number) {
    const institution = await this.institutionRepository.findOneOrFail({ id });
    return institution;
  }

  async getBillingAncestorForInstitution(institutionId: number) {
    return this.findById(institutionId);
  }

  async create(name: string, type: string) {
    // TODO: make this real
    const institution = this.institutionRepository.create({
      name,
      type,
      lft: 666,
      rgt: 667,
      level: 1,
      isActive: true,
    });
    await this.institutionRepository.persistAndFlush(institution);
    return institution;
  }
}
