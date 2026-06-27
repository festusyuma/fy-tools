import { AnyRoute, Response } from '@fy-tools/rpc-server';
import type { AnyElysia } from 'elysia';

import { RouteToContext } from './types';

export class Route<
  App extends AnyElysia = AnyElysia,
  Schema extends AnyRoute = AnyRoute
> {
  private _handlerFn = (ctx: unknown) => {
    throw new Error('Route handler not implemented');
  };

  constructor(public _app: App, public _schema: Schema) {
    const response = this._schema._response as Response<Schema['_response']>;
    const routeSchema = {
      response: { 200: response },
      body: this._schema._body as Schema['_body'],
      params: this._schema._params as Schema['_params'],
      query: this._schema._query as Schema['_query'],
    };

    const route = (this._app as AnyElysia).route(
      this._schema._method.toUpperCase() as Uppercase<Schema['_method']>,
      this._schema._path as Schema['_path'],
      (ctx: unknown) => this._handlerFn(ctx) as any,
      routeSchema
    );

    this._app = route as App;
  }

  build<T extends AnyElysia>(fn: (app: App) => T) {
    const newApp = fn(this._app);
    return new Route<T, Schema>(newApp, this._schema);
  }

  handler<RouteContext extends RouteToContext<typeof this>>(
    fn: (ctx: RouteContext) => Promise<Response<Schema>> | Response<Schema>
  ) {
    this._handlerFn = fn as typeof this._handlerFn;
  }
}
