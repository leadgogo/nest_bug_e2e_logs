import { Injectable } from '@nestjs/common';
import { BaseFeatureStrategy } from './base-feature-strategy';

@Injectable()
export class AbTestingFeatureStrategy extends BaseFeatureStrategy {
  institutionHasFeature(institutionId: number, featureName: string) {
    return institutionId % 2 === 0;
  }
}
