export abstract class BaseFeatureStrategy {
  abstract institutionHasFeature(
    institutionId: number,
    featureName: string
  ): boolean | Promise<boolean>;
}
