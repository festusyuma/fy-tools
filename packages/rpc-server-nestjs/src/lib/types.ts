import { Route as _Route } from '@fy-tools/rpc-server';

import { Route } from './route';

export type FromBaseRoute<T extends _Route> = T extends _Route<
  infer TPath,
  infer TMethod,
  infer TResponse,
  infer TBody,
  infer TParams,
  infer TQuery,
  infer TAuth
>
  ? Route<TPath, TMethod, TResponse, TBody, TParams, TQuery, TAuth>
  : never;
