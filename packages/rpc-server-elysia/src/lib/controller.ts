import {
  AnyController,
  makeFlatProxy,
  Route as _R,
} from '@fy-tools/rpc-server';
import { AnyElysia, Elysia } from 'elysia';

type GetRouteApp<
  A extends AnyElysia,
  BasePath extends string
> = A extends Elysia<
  infer _,
  infer Singleton,
  infer Definitions,
  infer Metadata,
  infer Routes,
  infer Ephemeral,
  infer Volatile
>
  ? Elysia<
      BasePath,
      Singleton,
      Definitions,
      Metadata,
      Routes,
      Ephemeral,
      Volatile
    >
  : never;

type ElysiaDeepReplace<T, RA extends AnyElysia> = {
  [K in keyof T]: 0 extends 1 & T[K]
    ? T[K]
    : T[K] extends _R
    ? Route<RA, T[K]>
    : T[K] extends object
    ? ElysiaDeepReplace<T[K], RA>
    : T[K];
};

import { Route } from './route';

export class Controller<
  App extends AnyElysia = Elysia,
  Schema extends AnyController = AnyController,
  RouteMap = ElysiaDeepReplace<
    Schema['_routes'],
    GetRouteApp<App, Schema['_basePath']>
  >
> {
  private routes: Record<string, Route> = {};

  /**
   * Requests.
   * @description Map of all requests in the schema.
   * */
  public R: RouteMap;

  constructor(public _app: App, public _schema: Schema) {
    const path = this._schema._basePath as Schema['_basePath'];

    const appGroup = (this._app as AnyElysia).group(path, (a: AnyElysia) => {
      let appGroup: AnyElysia = a;

      for (const i in _schema._routes) {
        const route = new Route(a, this._schema._routes[i]);

        appGroup = route._app;
        this.routes[i as keyof typeof this.routes] = route;
      }

      return appGroup;
    });

    this._app = appGroup as App;

    this.R = makeFlatProxy(this.routes) as RouteMap;
  }

  build<T extends AnyElysia>(fn: (app: App) => T) {
    const newApp = fn(this._app);
    return new Controller<T, Schema>(newApp, this._schema);
  }
}
