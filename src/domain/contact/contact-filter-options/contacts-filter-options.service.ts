import { EntityRepository } from '@mikro-orm/mysql';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { OrderDirection } from 'src/application/graphql/enums/order-direction.enum';
import { ListConfig } from 'src/application/graphql/lists/list-args/list-config.type';
import { DatabaseQueryConfigApplier } from '../../../infrastructure/database/database-query-config-applier';
import { DatabasePaginator } from '../../../infrastructure/database/database.paginator';
import { InstitutionService } from '../../institution/institution.service';
import { UserRepository } from '../../user/user.repository';
import { ContactTag } from '../contact-tag/contact-tag.entity';

@Injectable()
export class ContactsFilterOptionsService {
  constructor(
    private userRepository: UserRepository,
    @InjectRepository(ContactTag)
    private contactTagRepository: EntityRepository<ContactTag>,
    private institutionService: InstitutionService,
    private applier: DatabaseQueryConfigApplier<ContactTag>
  ) {}

  async getAccounts(institutionId: number, fields: string[], active?: boolean) {
    const institution = await this.institutionService.findById(institutionId);
    const qb = this.userRepository.createAugmentedQueryBuilder();
    qb.select(fields)
      .join('institution', 'i')
      .join('institutionRoles', 'ir')
      .join('ir.role', 'r', {
        'r.institutionType': institution.type,
      })
      .where({
        $or: [
          {
            $and: [
              { 'i.lft': { $lte: institution.lft } },
              { 'i.rgt': { $gte: institution.rgt } },
            ],
          },
          {
            $and: [
              { 'i.lft': { $gte: institution.lft } },
              { 'i.rgt': { $lte: institution.rgt } },
            ],
          },
        ],
      });
    if (typeof active !== 'undefined') {
      qb.andWhere({ active: active });
    }
    const users = await qb.getResult();
    return users;
  }

  async getTags(institutionId: number, listConfig: ListConfig) {
    const { queryConfig, paginationConfig } = listConfig;
    const qb = this.contactTagRepository.createQueryBuilder().where({
      isActive: true,
      company: institutionId,
    });

    // const result = await something();

    this.applier.apply(qb, queryConfig);

    const result = await new DatabasePaginator({
      paginationConfiguration: paginationConfig,
      qb,
      implicitOrderBy: { id: OrderDirection.ASC },
    }).getPage();

    return result;
  }
}
