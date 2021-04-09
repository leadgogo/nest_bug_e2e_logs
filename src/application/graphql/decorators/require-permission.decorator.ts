import { Extensions } from '@nestjs/graphql';

export function RequirePermission(...permissions: string[]) {
  return function (
    target: Object | Function,
    propertyKey?: string | symbol,
    propertyDescriptor?: PropertyDescriptor
  ) {
    const decorator = Extensions({ permissions });
    if (typeof target === 'function') {
      decorator(target);
    } else {
      if (typeof propertyKey === 'undefined') {
        throw new Error('propertyKey is not defined');
      }
      if (typeof propertyDescriptor === 'undefined') {
        decorator(target, propertyKey);
      } else {
        decorator(target, propertyKey, propertyDescriptor);
      }
    }
  };
}
