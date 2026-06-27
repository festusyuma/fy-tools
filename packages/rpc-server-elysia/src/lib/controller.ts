import {
  AnyController,
  makeFlatProxy,
  Route as _R,
} from '@fy-tools/rpc-server';
import { AnyElysia, Elysia } from 'elysia';

import { Route } from './route';

export class Controller<
  App extends AnyElysia = Elysia,
  Schema extends AnyController = AnyController
> {
  private routes: Record<string, Route> = {};

  /**
   * Requests.
   * @description Map of all requests in the schema.
   * */
  public R;

  constructor(public _app: App, public _schema: Schema) {
    const path = this._schema._basePath as Schema['_basePath'];

    const appGroup = this._app.group(path, (a) => {
      let appGroup = a;

      for (const i in _schema._routes) {
        const route = new Route(a as AnyElysia, this._schema._routes[i]);

        appGroup = route._app;
        this.routes[i as keyof typeof this.routes] = route;
      }

      return appGroup;
    });

    this._app = appGroup as App;

    type RouteApp = App extends Elysia<
      infer _,
      infer Singleton,
      infer Definitions,
      infer Metadata,
      infer Routes,
      infer Ephemeral,
      infer Volatile
    >
      ? Elysia<
          Schema['_basePath'],
          Singleton,
          Definitions,
          Metadata,
          Routes,
          Ephemeral,
          Volatile
        >
      : never;

    type DeepReplace<T> = {
      [K in keyof T]: T[K] extends _R
        ? Route<RouteApp, T[K]>
        : T[K] extends object
        ? DeepReplace<T[K]>
        : T[K];
    };

    type RouteMap = DeepReplace<Schema['_routes']>;

    this.R = makeFlatProxy(this.routes) as RouteMap;
  }

  build<T extends AnyElysia>(fn: (app: App) => T) {
    const newApp = fn(this._app);
    return new Controller<T, Schema>(newApp, this._schema);
  }
}
