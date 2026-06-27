import type {
  Body,
  Params,
  Query,
  Response,
  Route as _Route,
} from '@fy-tools/rpc-server';
import { StandardSchemaV1 } from '@standard-schema/spec';
import type {
  CreateEden,
  Elysia,
  InferContext,
  MergeElysiaInstances,
} from 'elysia';

import type { Route } from './route';

export type RouteInputSchema = {
  body?: StandardSchemaV1;
  query?: StandardSchemaV1;
  params?: StandardSchemaV1;
};

export type RouteToContext<R> = R extends Route<infer A, infer T>
  ? Omit<InferContext<A>, 'body' | 'params' | 'query'> & {
      body: Body<T>;
      params: Params<T>;
      query: Query<T>;
    }
  : never;

export type InstanceFromRoute<
  App,
  AppRoute,
  Schema extends _Route
> = App extends Elysia<
  infer Path,
  infer Singleton,
  infer Definitions,
  infer Metadata,
  infer _,
  infer Ephemeral,
  infer Volatile
>
  ? MergeElysiaInstances<
      [
        App,
        AppRoute extends Elysia
          ? Elysia<
              Path,
              Singleton,
              Definitions,
              Metadata,
              CreateEden<
                Schema['_path'],
                {
                  [K in Schema['_method']]: {
                    body: Body<Schema>;
                    query: Query<Schema>;
                    params: Params<Schema>;
                    response: {
                      200: Response<Schema>;
                    };
                  };
                }
              >,
              Ephemeral,
              Volatile
            >
          : never
      ]
    >
  : never;

export type HandlerFunction<T extends Route> = (
  ctx: RouteToContext<T>
) => Promise<Response<T['_schema']>> | Response<T['_schema']>;
