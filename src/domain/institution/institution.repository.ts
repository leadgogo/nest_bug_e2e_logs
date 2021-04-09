import { Repository, EntityRepository } from '@mikro-orm/core';
import { Institution } from './institution.entity';

@Repository(Institution)
export class InstitutionRepository extends EntityRepository<Institution> {}
