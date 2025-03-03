import type { TypeOf, ZodObject, ZodRawShape } from 'zod';

import type { App, Controller, Route } from '@fy-tools/rpc-server';
import { HttpMethod, methods } from './constants.js';

type ParseSchema<T> = T extends ZodObject<ZodRawShape> ? TypeOf<T> : never;

type StripNever<T> = {
  [K in keyof T as T[K] extends never ? never : K]: T[K];
};

type IsRoutePath<T, TP extends string> = T extends Route<TP> ? T : never;
type IsRouteMethod<T, TM extends HttpMethod> = T extends Route<infer P, TM>
  ? T
  : never;

type Payload<R extends Route> = StripNever<{
  body: ParseSchema<R['_body']>;
  params: ParseSchema<R['_params']>;
  query: ParseSchema<R['_query']>;
}>;

export function rpcClient<T extends App<Controller<any, any>[]>>() {
  type Controllers = T['_controllers'][number];
  type Routes = Controllers['_routes'][number];

  return <TPath extends Routes['_path']>(path: TPath) => {
    type PRoute = IsRoutePath<Routes, TPath>;

    async function req(method: HttpMethod, payload: unknown): Promise<unknown> {
      console.log(method, path, payload);
      // todo
      //  Format query and params.
      //  Implement api call here
      return {};
    }

    return Object.fromEntries(
      Object.entries(methods).map((p) => [
        p[1],
        (payload: unknown) => req(p[1], payload)
      ])
    ) as {
      [key in (typeof methods)[PRoute['method']]]: (
        payload: Payload<IsRouteMethod<PRoute, key>>
      ) => Promise<ParseSchema<IsRouteMethod<PRoute, key>['_response']>>;
    };
  };
}
