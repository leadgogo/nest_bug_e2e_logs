import { Args, Query, Resolver } from '@nestjs/graphql';
import { AuthorizationService } from 'src/application/authorization/authorization.service';
import { Institution } from './institution.entity';

@Resolver(() => Institution)
export class InstitutionResolver {
  constructor(private authorizationService: AuthorizationService) {}

  @Query(() => [String])
  async getFeaturesForInstitution(
    @Args('institutionId') institutionId: number
  ) {
    const featureNames = await this.authorizationService.getFeaturesForInstitution(
      institutionId
    );
    return featureNames;
  }
}
