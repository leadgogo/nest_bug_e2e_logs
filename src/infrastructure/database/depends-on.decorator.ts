import { Type } from '@nestjs/common';

export const virtualProperties = new Map<string, Map<string, string[]>>();

export function DependsOn<T extends Object>(
  ...dependantProperties: (keyof T)[]
): MethodDecorator;
export function DependsOn<T extends Object>(
  entity: Type<T>,
  ...dependantProperties: (keyof T)[]
): MethodDecorator;
export function DependsOn<T extends Object>(
  entityOrFirstProperty: Type<T> | keyof T,
  ...dependantProperties: (keyof T)[]
): MethodDecorator {
  return (target: Object, propertyKey: string | symbol): void => {
    const entity: Object =
      typeof entityOrFirstProperty === 'string'
        ? target
        : // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (entityOrFirstProperty as any).prototype;
    const properties: string[] = (typeof entityOrFirstProperty === 'string'
      ? [entityOrFirstProperty]
      : []
    )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .concat(dependantProperties as any);
    const entityName = entity.constructor.name;
    let classEntry = virtualProperties.get(entityName);
    if (!classEntry) {
      classEntry = new Map<string, string[]>();
      virtualProperties.set(entityName, classEntry);
    }
    classEntry.set(propertyKey.toString(), properties);
  };
}
