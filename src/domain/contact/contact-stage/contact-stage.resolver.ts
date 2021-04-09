import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Loader } from 'src/application/graphql/decorators/loader.decorator';
import { RequestedScalarFields } from 'src/application/graphql/decorators/requested-fields.decorator';
import { DependsOn } from 'src/infrastructure/database/depends-on.decorator';
import { ContactStage } from './contact-stage.entity';
import { ContactStageService } from './contact-stage.service';
import { ContactStatus } from './contact-status/contact-status.entity';
import { LocaleArg } from 'src/application/graphql/decorators/locale-arg.decorator';
import { localizeProperty } from 'src/utils/i18n/localize-property';

@Resolver(() => ContactStage)
export class ContactStageResolver {
  constructor(private contactStageService: ContactStageService) {}

  @ResolveField(() => [ContactStatus])
  async statuses(
    @Parent() contactStage: ContactStage,
    @RequestedScalarFields() fields: string[],
    @Loader() loader: Loader<number, ContactStatus[]>
  ) {
    const statuses = await loader(contactStage.id, (contactStageIds) => {
      return this.contactStageService.getStatusesByStage(
        fields,
        contactStageIds
      );
    });
    return statuses;
  }

  @DependsOn(ContactStage, 'nameEn', 'nameEs')
  @ResolveField()
  name(
    @LocaleArg() locale: string,
    @Parent() contactStatus: ContactStage
  ): string {
    const property = localizeProperty('name', locale);
    return contactStatus[property];
  }
}
