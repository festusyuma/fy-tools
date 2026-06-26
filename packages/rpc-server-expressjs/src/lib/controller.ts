import type {
  AnyController,
  RouteByFullPath,
  RouteFullPath,
} from '@fy-tools/rpc-server';
import type { Application, Router } from 'express';
import express from 'express';

import { Route } from './route';

export class Controller<
  App extends Application = Application,
  Schema extends AnyController = AnyController
> {
  /**
   * Requests.
   * @description Map of all requests in the schema.
   * */
  public R;

  constructor(public _app: App, public _schema: Schema) {
    const router: Router = express.Router();
    const routes: Record<string, Route> = {};

    for (const i in _schema._routes_map) {
      routes[i] = new Route(router, _schema._routes[_schema._routes_map[i]]);
    }

    const basePath = this._schema._basePath
      ? `/${this._schema._basePath}`
      : '/';

    this._app.use(basePath, router);

    this.R = new Proxy(
      routes as unknown as {
        [key in RouteFullPath<Schema['_routes'][number]>]: Route<
          Router,
          RouteByFullPath<Schema['_routes'][number], key>
        >;
      },
      {
        get(target, p) {
          return routes[p as keyof typeof routes];
        },
      }
    );
  }

  build<T extends Application>(fn: (app: App) => T) {
    return new Controller<T, Schema>(fn(this._app), this._schema);
  }
}
