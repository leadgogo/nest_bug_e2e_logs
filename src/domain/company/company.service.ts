import { Injectable } from '@nestjs/common';
import { cached } from '../../utils/decorators/cached';
import { InstitutionService } from '../institution/institution.service';
import { CompanyRepository } from './company.repository';
import { SessionService } from 'src/application/session/session.service';
import { NotFoundApiError } from 'src/application/errors/api-error/not-found.api-error';
import { ListConfig } from 'src/application/graphql/lists/list-args/list-config.type';
import { Page } from 'src/application/pagination/base.paginator';
import { Company } from 'src/domain/company/company.entity';
import { DatabaseQueryConfigApplier } from 'src/infrastructure/database/database-query-config-applier';
import { OrderDirection } from 'src/application/graphql/enums/order-direction.enum';
import { DatabasePaginator } from 'src/infrastructure/database/database.paginator';
import { BusinessRuleApiError } from 'src/application/errors/api-error/business-rule.api-error';

@Injectable()
export class CompanyService {
  constructor(
    private sessionService: SessionService,
    private institutionService: InstitutionService,
    private companyRepository: CompanyRepository,

    private applier: DatabaseQueryConfigApplier<Company>
  ) {}

  private async createQueryBuilder(requestedFields: string[]) {
    const { lft, rgt } = await this.institutionService.findById(
      (await this.sessionService.getCurrentUser()).institutionId
    );
    const qb = this.companyRepository
      .createAugmentedQueryBuilder({
        fields: requestedFields,
      })
      .join('institution', 'i')
      .where({
        $and: [{ 'i.lft': { $gte: lft } }, { 'i.rgt': { $lte: rgt } }],
      });
    return qb;
  }

  async fincById(id: number) {
    return this.companyRepository.findOneOrFail({ id });
  }

  async getPage(listConfig: ListConfig): Promise<Page<Company>> {
    const { queryConfig, paginationConfig } = listConfig;
    const qb = await this.createQueryBuilder(listConfig.queryConfig.fields);
    this.applier.apply(qb, queryConfig);
    const page = await new DatabasePaginator({
      paginationConfiguration: paginationConfig,
      qb,
      implicitOrderBy: { id: OrderDirection.ASC },
    }).getPage();
    return page;
  }

  async getMany(requestedFields: string[], ids: number[]) {
    const qb = await this.createQueryBuilder(requestedFields);
    qb.andWhere({ id: ids });
    const companies = await qb.getResult();
    const map = Object.fromEntries(
      companies.map((company) => [company.id.toString(), company])
    );
    return map;
  }

  async getOne(requestedFields: string[], id: number) {
    const qb = await this.createQueryBuilder(requestedFields);
    qb.andWhere({ id });
    const company = await qb.getSingleResult();
    if (!company) {
      throw new NotFoundApiError();
    }
    return company;
  }

  @cached()
  async canCompanyShowContactPhonenumbersToSalesPeople(companyId: number) {
    return Promise.resolve(false);
  }

  async ensureCurrentUserCanShowContactPhonenumbersToSalesPeople(companyId: number) {
    if (!(await this.canCompanyShowContactPhonenumbersToSalesPeople(companyId))) {
      throw new BusinessRuleApiError('SALES_CANNOT_VIEW_CONTACT_PHONE_NUMBER');
    }
  }

  async create(name: string, parentInstitutionId: number): Promise<Company> {
    const institution = await this.institutionService.create(name, 'Company');
    const company = this.companyRepository.create({
      id: institution.id,
    });
    await this.companyRepository.persistAndFlush(company);
    return company;
  }
}
