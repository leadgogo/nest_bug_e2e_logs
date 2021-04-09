// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface GqlResponseBody<TData = any> {
  errors?: {
    extensions: {
      category: string;
      code: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      detail: any;
    };
  }[];
  data: TData;
}
