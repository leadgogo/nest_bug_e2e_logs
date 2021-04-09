import { Module, Global } from '@nestjs/common';
import { RoleModule } from './role/role.module';
import { UserModule } from './user/user.module';
import { ContactModule } from './contact/contact.module';
import { InstitutionModule } from './institution/institution.module';
import { CompanyModule } from './company/company.module';
import { DomainEventService } from 'src/domain/utils/domain-events/domain-event.service';
import { IntegrationEventService } from 'src/domain/utils/integration-events/integration-event.service';

@Global()
@Module({
  imports: [RoleModule, UserModule, InstitutionModule, ContactModule, CompanyModule],
  providers: [DomainEventService, IntegrationEventService],
  exports: [
    UserModule,
    RoleModule,
    InstitutionModule,
    DomainEventService,
    IntegrationEventService,
  ],
})
export class DomainModule {}
