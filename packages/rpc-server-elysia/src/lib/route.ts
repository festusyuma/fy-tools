import type {
  AnyRoute,
  Body,
  Params,
  Query,
  Response,
} from '@fy-tools/rpc-server';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { AnyElysia, Elysia } from 'elysia';

import { InstanceFromRoute, RouteToContext } from './types';

export class Route<
  App extends AnyElysia = Elysia,
  Schema extends AnyRoute = AnyRoute
> {
  constructor(public _app: App, public _schema: Schema) {}

  build<T extends AnyElysia>(fn: (app: App) => T) {
    const newApp = fn(this._app);
    return new Route<T, Schema>(newApp, this._schema);
  }

  handler<RouteContext extends RouteToContext<App, Schema>>(
    fn: (ctx: RouteContext) => Promise<Response<Schema>>,
    hook: { response?: Record<Exclude<number, 200>, StandardSchemaV1> } = {}
  ) {
    const response = this._schema._response as StandardSchemaV1<
      Response<Schema>
    >;

    const routeSchema = {
      response: { 200: response, ...hook.response },
      body: this._schema._body as StandardSchemaV1<Body<Schema>>,
      params: this._schema._params as StandardSchemaV1<Params<Schema>>,
      query: this._schema._query as StandardSchemaV1<Query<Schema>>,
    };

    const route = this._app.route(
      this._schema._method.toUpperCase() as Uppercase<Schema['_method']>,
      this._schema._path as Schema['_path'],
      fn as any,
      { ...hook, ...routeSchema }
    );

    return route as InstanceFromRoute<App, typeof route, Schema>;
  }
}
