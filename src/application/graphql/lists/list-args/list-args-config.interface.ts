export interface ListArgsConfig {
  propertyName: string | symbol;
  includeInWhere: boolean;
  includeInOrderBy: boolean;
  type: Function | Function[] | string | string[];
}
