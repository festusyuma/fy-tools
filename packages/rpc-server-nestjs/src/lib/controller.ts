import { applyDecorators, Controller as N_Controller } from '@nestjs/common';

import {
  Controller as _Controller,
  Route,
  stripSlashes,
} from '@fy-tools/rpc-server';

export class Controller<
  BTPath extends string | undefined = any,
  TRoutes extends Route[] = never[]
> extends _Controller<BTPath, TRoutes> {
  constructor(_basePath = undefined as BTPath) {
    super(_basePath);
  }

  override route<TR extends Route>(route: TR) {
    const controller = super.route(route);
    type controller = typeof controller;

    return this as unknown as Controller<
      BTPath,
      controller['_routes']
    >;
  }

  get Controller() {
    return applyDecorators(N_Controller(stripSlashes(this._basePath)));
  }
}
