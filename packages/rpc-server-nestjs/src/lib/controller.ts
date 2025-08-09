import {
  Controller as _Controller,
  RouteByFullPath,
  RouteFullPath,
} from '@fy-tools/rpc-server';
import { applyDecorators, Controller as N_Controller } from '@nestjs/common';

import { Route } from './route';
import { AppConfig } from './types';

export class Controller<Schema extends _Controller<any, any>> {
  /**
   * Requests.
   * @description Map of all requests in the schema.
   * */
  public R: {
    [key in RouteFullPath<Schema['_routes'][number]>]: Route<
      RouteByFullPath<Schema['_routes'][number], key>
    >;
  } = {} as {
    [key in RouteFullPath<Schema['_routes'][number]>]: Route<
      RouteByFullPath<Schema['_routes'][number], key>
    >;
  };

  constructor(public _schema: Schema, config?: AppConfig) {
    for (const i in _schema._routes_map) {
      this.R[i as keyof typeof this.R] = new Route(
        this._schema._routes[_schema._routes_map[i]],
        config?.toJsonSchema
      );
    }
  }

  get Controller() {
    return applyDecorators(N_Controller(this._schema._basePath));
  }
}
