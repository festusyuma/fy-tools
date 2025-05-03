import { Controller as _Controller, RouteByFullPath, RouteFullPath } from '@fy-tools/rpc-server';
import { applyDecorators, Controller as N_Controller } from '@nestjs/common';

import { Route } from './route';
import { AppConfig } from './types';

export class Controller<Schema extends _Controller<any, any>> {
  public _routes: Record<string, any> = {};

  constructor(public _schema: Schema, config?: AppConfig) {
    for (const i in _schema._routes_map) {
      this._routes[i] = new Route(
        this._schema._routes[_schema._routes_map[i]],
        config?.toJsonSchema
      );
    }
  }

  getRoute<
    TRoutes extends Schema['_routes'][number],
    TPath extends RouteFullPath<TRoutes>,
    TRoute extends RouteByFullPath<TRoutes, TPath>
  >(path: TPath): Route<TRoute> {
    return this._routes[path];
  }

  get Controller() {
    return applyDecorators(N_Controller(this._schema._basePath));
  }
}
