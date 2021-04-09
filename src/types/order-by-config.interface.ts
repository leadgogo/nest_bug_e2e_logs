import { OrderDirection } from 'src/application/graphql/enums/order-direction.enum';

export interface OrderByConfig {
  [x: string]: OrderDirection | OrderByConfig | undefined;
}
