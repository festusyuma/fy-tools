import {
  Controller as _Controller,
  makeFlatProxy,
  Route as _R,
} from '@fy-tools/rpc-server';
import { applyDecorators, Controller as N_Controller } from '@nestjs/common';

import { Route } from './route';
import { AppConfig } from './types';

type NestRouteDeepReplace<T> = {
  [K in keyof T]: 0 extends 1 & T[K]
    ? T[K]
    : T[K] extends _R
    ? Route<T[K]>
    : T[K] extends object
    ? NestRouteDeepReplace<T[K]>
    : T[K];
};

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

    type RouteMap = NestRouteDeepReplace<Schema['_routes']>;

    this.R = makeFlatProxy(this.routes) as RouteMap;
  }

  get Controller() {
    return applyDecorators(N_Controller(this._schema._basePath));
  }
}
