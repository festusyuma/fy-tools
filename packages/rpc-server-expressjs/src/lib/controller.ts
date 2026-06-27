import {
  AnyController,
  Route as _R,
  makeFlatProxy,
} from '@fy-tools/rpc-server';
import type { Application, Router } from 'express';
import express from 'express';

import { Route } from './route';

export class Controller<
  App extends Application = Application,
  Schema extends AnyController = AnyController
> {
  private routes: Record<string, Route> = {};

  /**
   * Requests.
   * @description Map of all requests in the schema.
   * */
  public R;

  constructor(public _app: App, public _schema: Schema) {
    const router: Router = express.Router();

    for (const i in _schema._routes) {
      this.routes[i] = new Route(router, _schema._routes[i]);
    }

    const basePath = this._schema._basePath
      ? `/${this._schema._basePath}`
      : '/';

    this._app.use(basePath, router);

    type DeepReplace<T> = {
      [K in keyof T]: T[K] extends _R
        ? Route<Router, T[K]>
        : T[K] extends object
        ? DeepReplace<T[K]>
        : T[K];
    };

    type RouteMap = DeepReplace<Schema['_routes']>;

    this.R = makeFlatProxy(this.routes) as RouteMap;
  }

  build<T extends Application>(fn: (app: App) => T) {
    return new Controller<T, Schema>(fn(this._app), this._schema);
  }
}
