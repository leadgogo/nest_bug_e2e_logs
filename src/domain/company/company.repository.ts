import { Repository } from '@mikro-orm/core';
import { BaseRepository } from '../../infrastructure/database/base.repository';
import { Company } from './company.entity';

@Repository(Company)
export class CompanyRepository extends BaseRepository<Company> {}
