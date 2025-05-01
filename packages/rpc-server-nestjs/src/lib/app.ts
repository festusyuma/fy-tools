import {
  App as _App,
  Controller,
  RouteByFullPath,
  RouteFullPath,
} from '@fy-tools/rpc-server';
import type { ZodInterface } from 'zod';

import { FromBaseRoute } from './types';

export class App<
  T extends Controller[] = never[],
  TE extends { [k in number]: ZodInterface } = {
    [key in never]: never;
  }
> extends _App<T, TE> {
  override controller<TC extends Controller<any, any>>(controller: TC) {
    const updated = super.controller(controller);
    return updated as App<
      (typeof updated)['_controllers'],
      (typeof updated)['_errors']
    >;
  }

  override error<Status extends number, Body extends ZodInterface>(
    status: Status,
    error: Body
  ) {
    const updated = super.error(status, error);
    return updated as App<
      (typeof updated)['_controllers'],
      (typeof updated)['_errors']
    >;
  }

  override getRoute<
    TRoutes extends (typeof this._controllers)[number]['_routes'][number],
    TPath extends RouteFullPath<TRoutes>,
    TResponse = FromBaseRoute<RouteByFullPath<TRoutes, TPath>>
  >(path: TPath): TResponse {
    return super.getRoute(path);
  }
}
