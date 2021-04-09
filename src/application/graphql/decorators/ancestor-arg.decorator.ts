import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GraphQLResolveInfo, FieldNode } from 'graphql';

interface AncestorArgs {
  pathItem: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: Record<string, { value: any; kind: string }>;
}

export const AncestorArg = createParamDecorator(
  <T>(key: string, ctx: ExecutionContext): T => {
    const info = GqlExecutionContext.create(ctx).getInfo<GraphQLResolveInfo>();
    const pathItems: string[] = [];
    let currentPath: typeof info.path | undefined = info.path;
    while (currentPath) {
      pathItems.splice(0, 0, currentPath.key as string);
      currentPath = currentPath.prev;
    }
    const ancestorPathItems = pathItems.slice(0, -1);
    let currentSelectionSet: typeof info.operation.selectionSet | undefined =
      info.operation.selectionSet;
    const ancestorArgsList: AncestorArgs[] = [];
    for (const pathItem of ancestorPathItems) {
      if (!currentSelectionSet) {
        break;
      }
      const selection:
        | FieldNode
        | undefined = (currentSelectionSet.selections as FieldNode[]).find(
        (selection) => selection.name?.value === pathItem
      );
      if (typeof selection === 'undefined') {
        throw new Error(`Did not find ${pathItem} in selectionSet.`);
      }
      const args = selection.arguments
        ? Object.fromEntries(
            selection.arguments.map((argument) => [
              argument.name.value,
              {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                value: (argument.value as any).value,
                kind: argument.value.kind,
              },
            ])
          )
        : {};
      const currentAncestorArgs: AncestorArgs = {
        pathItem,
        args,
      };
      ancestorArgsList.push(currentAncestorArgs);
      currentSelectionSet = selection.selectionSet;
    }
    for (const ancestorArgsItem of ancestorArgsList.reverse()) {
      if (!(key in ancestorArgsItem.args)) {
        continue;
      }
      return ancestorArgsItem.args[key].value as T;
    }
    throw new Error(
      `Did not find argument with key ${key} in ancestor fields.`
    );
  }
);
