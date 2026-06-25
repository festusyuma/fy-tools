import type {
  Body,
  Params,
  Query,
  Response,
  Route,
} from '@fy-tools/rpc-server';
import { StandardSchemaV1 } from '@standard-schema/spec';
import type {
  AnyElysia,
  CreateEden,
  Elysia,
  InferContext,
  MergeElysiaInstances,
} from 'elysia';

export type RouteInputSchema = {
  body?: StandardSchemaV1;
  query?: StandardSchemaV1;
  params?: StandardSchemaV1;
};

export type RouteToContext<A extends AnyElysia, T extends Route> = Omit<
  InferContext<A>,
  'body' | 'params' | 'query'
> & {
  body: Body<T>;
  params: Params<T>;
  query: Query<T>;
};

export type InstanceFromRoute<
  App,
  AppRoute,
  Schema extends Route
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
                  get: {
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
