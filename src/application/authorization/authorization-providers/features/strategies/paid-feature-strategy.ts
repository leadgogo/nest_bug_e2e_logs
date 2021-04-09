import { Injectable } from '@nestjs/common';
import { InstitutionService } from '../../../../../domain/institution/institution.service';
import { BaseFeatureStrategy } from './base-feature-strategy';

@Injectable()
export class PaidFeatureStrategy extends BaseFeatureStrategy {
  constructor(private institutionService: InstitutionService) {
    super();
  }

  institutionHasFeature(institutionId: number, featureName: string) {
    // const billingInstitution = await this.institutionService.getBillingAncestorForInstitution(
    //   institutionId,
    // );
    // get feature from other place
    return true;
  }
}
