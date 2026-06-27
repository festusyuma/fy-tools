import {
  Controller as _Controller,
  makeFlatProxy,
  Route as _R,
} from '@fy-tools/rpc-server';
import { applyDecorators, Controller as N_Controller } from '@nestjs/common';

import { Route } from './route';
import { AppConfig } from './types';

export class Controller<Schema extends _Controller<any, any>> {
  private routes: Record<string, Route<any>> = {};

  /**
   * Requests.
   * @description Map of all requests in the schema.
   * */
  public R;

  constructor(public _schema: Schema, config?: AppConfig) {
    for (const i in _schema._routes) {
      this.routes[i] = new Route(this._schema._routes[i], config?.toJsonSchema);
    }

    type DeepReplace<T> = {
      [K in keyof T]: T[K] extends _R
        ? Route<T[K]>
        : T[K] extends object
        ? DeepReplace<T[K]>
        : T[K];
    };

    type RouteMap = DeepReplace<Schema['_routes']>;

    this.R = makeFlatProxy(this.routes) as RouteMap;
  }

  get Controller() {
    return applyDecorators(N_Controller(this._schema._basePath));
  }
}
