import { Injectable } from '@nestjs/common';
import { BaseFeatureStrategy } from './strategies/base-feature-strategy';
import { AbTestingFeatureStrategy } from './strategies/ab-testing-feature-strategy';
import { PaidFeatureStrategy } from './strategies/paid-feature-strategy';
import { MissingFeatureApiError } from '../../../errors/api-error/auth/missing-feature.api-error';

@Injectable()
export class FeaturesService {
  private featureStrategyMap: Map<string, BaseFeatureStrategy[]>;

  constructor(
    private paidFeaturesStrategy: PaidFeatureStrategy,
    abTestingStrategy: AbTestingFeatureStrategy
  ) {
    this.featureStrategyMap = new Map([
      ['some-new-feature', [abTestingStrategy]],
      ['some-paid-feature', [paidFeaturesStrategy]],
    ]);
  }

  clearFeatures() {
    this.featureStrategyMap.clear();
  }

  registerFeature(featureName: string, strategies: BaseFeatureStrategy[]) {
    this.featureStrategyMap.set(featureName, strategies);
  }

  async requireFeatureForInstitution(
    institutionId: number,
    featureName: string
  ): Promise<void> {
    const strategies = this.featureStrategyMap.get(featureName) ?? [
      this.paidFeaturesStrategy,
    ];
    const results = await Promise.all(
      strategies.map(async (strategy) => {
        const hasFeature = await strategy.institutionHasFeature(
          institutionId,
          featureName
        );
        return {
          hasFeature,
          strategy,
        };
      })
    );
    for (const { hasFeature, strategy } of results) {
      if (!hasFeature) {
        throw new MissingFeatureApiError(
          featureName,
          `The institution does not have access to this feature based on [${strategy.constructor.name}] strategy.`
        );
      }
    }
  }

  async getFeaturesForInstitution(institutionId: number): Promise<string[]> {
    const features = await Promise.all(
      Array.from(this.featureStrategyMap.keys()).map(async (featureName) => {
        const hasAccess = await this.requireFeatureForInstitution(
          institutionId,
          featureName
        )
          .then(() => true)
          .catch(() => false);
        return { featureName, hasAccess };
      })
    );
    const withAccess = features
      .filter(({ hasAccess }) => hasAccess)
      .map(({ featureName }) => featureName)
      .sort((a, b) => a.localeCompare(b));
    return withAccess;
  }
}
