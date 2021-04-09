import { Field, InputType } from '@nestjs/graphql';
import EnumUtils from 'enum-utils';
import { ListOperator } from 'src/application/graphql/enums/list-operator.enum';
import { ListArgsConfig } from 'src/application/graphql/lists/list-args/list-args-config.interface';
import {
  listArgsByClassName,
  listWhereInputTypesByClassName,
  scalarOrObjectWhereInputTypesByClassName,
} from 'src/application/graphql/lists/list-args/metadata';

const pendingFields: Map<Function, (() => void)[]> = new Map();

export function ObjectWhereInput(entityType: Function | string) {
  const entityName =
    typeof entityType === 'function' ? entityType.name : entityType;
  const listArgsProperties: ListArgsConfig[] = listArgsByClassName[entityName];
  if (
    !listArgsProperties ||
    listArgsProperties.filter((config) => config.includeInWhere).length === 0
  ) {
    throw new Error(`No where input handler found for ${entityName}`);
  }

  const clsName = `Base${entityName}WhereInput`;
  const container = {
    [clsName]: class {},
  };
  const baseWhereCls = container[clsName];

  pendingFields.set(baseWhereCls, []);
  for (const config of listArgsProperties) {
    const { propertyName, type } = config;
    if (config.includeInWhere) {
      pendingFields.get(baseWhereCls)?.push(() => {
        const fieldWhereInputType = getWhereInputType(type);
        Field(() => fieldWhereInputType, { nullable: true })(
          baseWhereCls.prototype,
          propertyName
        );
      });
    }
  }

  InputType()(baseWhereCls);

  return baseWhereCls;
}

export function ScalarWhereInputType(
  getEntityType: () => Function
): ClassDecorator {
  return function (cls: Function) {
    const entityType = getEntityType();
    const entityName = entityType.name;
    scalarOrObjectWhereInputTypesByClassName[entityName] = cls;
    InputType()(cls);
  };
}

function registerObjectWhereInputType(
  getEntityType: (() => Function) | string,
  cls: Function
) {
  const entityName =
    typeof getEntityType === 'function' ? getEntityType().name : getEntityType;
  if (entityName in scalarOrObjectWhereInputTypesByClassName) {
    throw new Error(
      `${entityName} already in scalarOrObjectWhereInputTypesByClassName`
    );
  }
  scalarOrObjectWhereInputTypesByClassName[entityName] = cls;
}

export function ObjectWhereInputType(
  getEntityType: (() => Function) | string,
  register = true
): ClassDecorator {
  return function (cls: Function) {
    if (register) {
      registerObjectWhereInputType(getEntityType, cls);
    }
    const parent = Object.getPrototypeOf(cls);
    const pending = pendingFields.get(parent);
    if (pending) {
      for (const fn of pending.slice()) {
        fn();
        pending.splice(pending.indexOf(fn), 1);
      }
    }
    for (const operator of ['_and', '_or']) {
      Field(() => [cls], { nullable: true })(cls.prototype, operator);
    }
    Field(() => cls, { nullable: true })(cls.prototype, '_not');
    InputType()(cls);
  };
}

export function ListWhereInputType(
  getEntityType: (() => Function) | string
): ClassDecorator {
  return function (cls: Function) {
    const entityName =
      typeof getEntityType === 'function'
        ? getEntityType().name
        : getEntityType;
    listWhereInputTypesByClassName[entityName] = cls;
    const objectWhereInputType = getWhereInputType(entityName);
    EnumUtils.values(ListOperator).forEach((operator) => {
      Field(() => objectWhereInputType, { nullable: true })(
        cls.prototype,
        operator
      );
    });
    InputType()(cls);
  };
}

function getListWhereInputType(listEntityType: Function[] | string[]) {
  const entityType = listEntityType[0];
  const entityName =
    typeof entityType === 'function' ? entityType.name : entityType;
  const handler: Function = listWhereInputTypesByClassName[entityName];
  if (handler) {
    return handler;
  } else {
    const clsName = `${entityName}ListWhereInput`;
    const container = {
      [clsName]: class {},
    };
    const whereCls = container[clsName];
    ListWhereInputType(entityName)(whereCls);
    return whereCls;
  }
}

export function getWhereInputType(
  entityType: Function | Function[] | string | string[]
) {
  if (Array.isArray(entityType)) {
    return getListWhereInputType(entityType);
  }
  const entityName =
    typeof entityType === 'function' ? entityType.name : entityType;
  const handler: Function =
    scalarOrObjectWhereInputTypesByClassName[entityName];
  if (handler) {
    return handler;
  } else {
    const clsName = `${entityName}WhereInput`;
    const container = {
      [clsName]: class extends ObjectWhereInput(entityType) {},
    };
    const whereCls = container[clsName];
    ObjectWhereInputType(entityName)(whereCls);
    return whereCls;
  }
}
