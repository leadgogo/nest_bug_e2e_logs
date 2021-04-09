import { Injectable } from '@nestjs/common';
import { DatabasePaginator } from '../../infrastructure/database/database.paginator';
import { DatabaseQueryConfigApplier } from '../../infrastructure/database/database-query-config-applier';
import { InstitutionService } from '../institution/institution.service';
import { CompanyService } from '../company/company.service';
import { ContactRepository } from './contact.repository';
import { Contact } from './contact.entity';
import { CreateContactInput } from './inputs/create-contact.input';
import { SessionService } from 'src/application/session/session.service';
import { AuthorizationService } from 'src/application/authorization/authorization.service';
import { OrderDirection } from 'src/application/graphql/enums/order-direction.enum';
import { NotFoundApiError } from 'src/application/errors/api-error/not-found.api-error';
import { ListConfig } from 'src/application/graphql/lists/list-args/list-config.type';
import { Page } from 'src/application/pagination/base.paginator';
import { isDefined } from '@leadgogo/backend-utils';
import { BusinessRuleApiError } from 'src/application/errors/api-error/business-rule.api-error';
import { UpdateContactInput } from 'src/domain/contact/inputs/update-contact.input';
import { DomainEventService } from 'src/domain/utils/domain-events/domain-event.service';
import { ContactCreatedEvent } from 'src/domain/contact/domain-events/contact-created.event';

@Injectable()
export class ContactService {
  constructor(
    private sessionService: SessionService,
    private authorizationService: AuthorizationService,
    private contactRepository: ContactRepository,
    private institutionService: InstitutionService,
    private companyService: CompanyService,
    private applier: DatabaseQueryConfigApplier<Contact>,
    private domainEventService: DomainEventService
  ) {}

  private async createQueryBuilder() {
    const { lft, rgt } = await this.institutionService.findById(
      (await this.sessionService.getCurrentUser()).institutionId
    );
    const qb = this.contactRepository
      .createAugmentedQueryBuilder()
      .join('company', 'c')
      .join('c.institution', 'i')
      .where({
        $and: [{ 'i.lft': { $gte: lft } }, { 'i.rgt': { $lte: rgt } }],
      });
    return qb;
  }

  async getPage(listConfig: ListConfig): Promise<Page<Contact>> {
    const { queryConfig, paginationConfig } = listConfig;
    const qb = await this.createQueryBuilder();
    this.applier.apply(qb, queryConfig);
    const page = await new DatabasePaginator({
      paginationConfiguration: paginationConfig,
      qb,
      implicitOrderBy: { id: OrderDirection.ASC },
    }).getPage();
    return page;
  }

  async getOne(fields: string[], id: number) {
    const qb = await this.createQueryBuilder();

    qb.addSelect(fields);
    qb.andWhere({ id });
    const contact = await qb.getSingleResult();
    if (!contact) {
      throw new NotFoundApiError();
    }
    return contact;
  }

  async verifyEmailIsUnique(email: string, contactId?: number) {
    const qb = this.contactRepository
      .createQueryBuilder()
      .where('lcase(email) = ?', [email.toLowerCase()]);
    if (typeof contactId !== 'undefined') {
      qb.andWhere('id != ?', [contactId]);
    }
    const result = await qb.getResult();
    if (result.length > 0) {
      throw new BusinessRuleApiError('EMAIL_EXISTS', 'Email already exists');
    }
  }

  async create(values: CreateContactInput) {
    const { companyId, ...rest } = values;
    const company = await this.companyService.fincById(companyId);
    await this.authorizationService.requireFeatureForInstitution(
      company.institution?.id,
      'some-paid-feature'
    );
    await this.verifyEmailIsUnique(rest.email);
    const contact = this.contactRepository.create(rest);
    contact.company = company;
    this.contactRepository.persist(contact);
    this.domainEventService.put(new ContactCreatedEvent(contact));
    return contact;
  }

  async update(contactId: number, values: UpdateContactInput) {
    const { companyId, ...fields } = values;
    if (fields.email) {
      await this.verifyEmailIsUnique(fields.email, contactId);
    }
    const contact = await this.contactRepository.findOneOrFail(contactId);
    Object.assign(contact, fields);
    if (isDefined(companyId)) {
      const company = await this.companyService.fincById(companyId);
      contact.company = company;
    }
    return contact;
  }
}
