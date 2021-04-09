import { IntegrationEvent } from '@leadgogo/backend-utils';
import { AnyEntity, EntityName } from '@mikro-orm/core';
import { CampaignAgent } from '../../domain/campaign/campaign-agent/campaign-agent.entity';
import { Campaign } from '../../domain/campaign/compaign.entity';
import { Company } from '../../domain/company/company.entity';
import { ContactStage } from '../../domain/contact/contact-stage/contact-stage.entity';
import { ContactStatus } from '../../domain/contact/contact-stage/contact-status/contact-status.entity';
import { ContactTag } from '../../domain/contact/contact-tag/contact-tag.entity';
import { Contact } from '../../domain/contact/contact.entity';
import { Institution } from '../../domain/institution/institution.entity';
import { Role } from '../../domain/role/role.entity';
import { UserInstitutionRole } from '../../domain/user/user-institution-role.entity';
import { User } from '../../domain/user/user.entity';

export const entities: EntityName<AnyEntity>[] = [
  IntegrationEvent,
  User,
  Role,
  UserInstitutionRole,
  Institution,
  Company,
  Contact,
  ContactStage,
  ContactStatus,
  ContactTag,
  Campaign,
  CampaignAgent,
];
