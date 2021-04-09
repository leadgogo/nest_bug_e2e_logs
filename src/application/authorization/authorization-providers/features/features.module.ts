import { Module } from '@nestjs/common';
import { FeaturesService } from './features.service';
import { AbTestingFeatureStrategy } from './strategies/ab-testing-feature-strategy';
import { PaidFeatureStrategy } from './strategies/paid-feature-strategy';

@Module({
  providers: [FeaturesService, AbTestingFeatureStrategy, PaidFeatureStrategy],
  exports: [FeaturesService],
})
export class FeaturesModule {}
