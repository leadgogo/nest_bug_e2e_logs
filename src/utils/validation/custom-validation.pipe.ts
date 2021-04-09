import { ValidationPipe, ArgumentMetadata } from '@nestjs/common';
import { validatorMap } from './validate-object.decorator';

export class CustomValidation extends ValidationPipe {
  async transform<T>(value: T, metadata: ArgumentMetadata) {
    let transformed: T = await super.transform(value, metadata);
    let cls = metadata.metatype;
    while (cls) {
      if (!cls?.name) {
        break;
      }
      const validator = validatorMap.get(cls);
      if (validator) {
        transformed = (await validator(transformed)) ?? transformed;
      }
      cls = Object.getPrototypeOf(cls);
    }
    return transformed;
  }
}
