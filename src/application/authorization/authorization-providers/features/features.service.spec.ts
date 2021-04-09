import { Test, TestingModule } from '@nestjs/testing';
import { FeaturesService } from './features.service';
import { AbTestingFeatureStrategy } from './strategies/ab-testing-feature-strategy';
import { BaseFeatureStrategy } from './strategies/base-feature-strategy';
import { PaidFeatureStrategy } from './strategies/paid-feature-strategy';

describe('features authorization provider', () => {
  let featuresService: FeaturesService;
  let paidFeatureStrategy: jest.Mocked<PaidFeatureStrategy>;
  let abTestingFeatureStrategy: AbTestingFeatureStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PaidFeatureStrategy,
          useFactory: jest.fn(() => ({
            institutionHasFeature: jest.fn(() => Promise.resolve(true)),
          })),
        },
        AbTestingFeatureStrategy,
        FeaturesService,
      ],
    }).compile();

    featuresService = module.get<FeaturesService>(FeaturesService);
    abTestingFeatureStrategy = module.get<AbTestingFeatureStrategy>(
      AbTestingFeatureStrategy
    );
    paidFeatureStrategy = module.get(PaidFeatureStrategy);
  });

  it('throws an exception when access to a feature is missing', async () => {
    class TestStrategy extends BaseFeatureStrategy {
      institutionHasFeature = () => Promise.resolve(false);
    }
    featuresService.registerFeature('feature-a', [new TestStrategy()]);
    await expect(
      featuresService.requireFeatureForInstitution(1, 'feature-a')
    ).rejects.toThrowError(/TestStrategy/);
  });

  it('does not throw when access to a feature is present', async () => {
    class TestStrategy extends BaseFeatureStrategy {
      institutionHasFeature = () => Promise.resolve(true);
    }
    featuresService.registerFeature('feature-a', [new TestStrategy()]);
    await expect(
      featuresService.requireFeatureForInstitution(1, 'feature-a')
    ).resolves.not.toThrow();
  });

  it('can produce the correct list of available features', async () => {
    class TestStrategy1 extends BaseFeatureStrategy {
      institutionHasFeature = () => Promise.resolve(false);
    }
    class TestStrategy2 extends BaseFeatureStrategy {
      institutionHasFeature = () => Promise.resolve(true);
    }
    featuresService.clearFeatures();
    featuresService.registerFeature('feature-a', [new TestStrategy1()]);
    featuresService.registerFeature('feature-b', [new TestStrategy2()]);
    featuresService.registerFeature('feature-c', [
      paidFeatureStrategy,
      abTestingFeatureStrategy,
    ]);
    featuresService.registerFeature('feature-d', [paidFeatureStrategy]);
    const availableFeatures = await featuresService.getFeaturesForInstitution(
      1
    );
    const expected = ['feature-b', 'feature-d'];
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(paidFeatureStrategy.institutionHasFeature).toHaveBeenCalledTimes(2);
    expect(availableFeatures).toEqual(expected);
  });
});
