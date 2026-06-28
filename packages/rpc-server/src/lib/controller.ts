/* eslint-disable @typescript-eslint/no-explicit-any */

import { Route } from './route.js';
import { ParseRoute, StripSlashes, WithParsedRoute } from './types.js';
import { stripSlashes } from './util/strip-slashes.js';

export class Controller<
  BTPath extends string | undefined = any,
  TRoutes extends object = object
> {
  _basePath: StripSlashes<BTPath>;
  _routes = {} as unknown as TRoutes;

  constructor(basePath = undefined as BTPath) {
    this._basePath = stripSlashes(basePath);
  }

  route<TR extends Route>(route: TR) {
    type NewTRoutes = TRoutes &
      WithParsedRoute<
        ParseRoute<`${TR['_path'] extends '' | undefined
          ? 'default'
          : Lowercase<TR['_path']>}/${Uppercase<TR['_method']>}`>,
        TR
      >;

    const controller = this as unknown as Controller<BTPath, NewTRoutes>;

    const fullPathKey = `${stripSlashes(
      `${`${stripSlashes(route._path) || 'default'}`.toLowerCase()}`
        .replaceAll('/', '.')
        .replaceAll(':', '$')
    )}.${route._method.toUpperCase()}`;

    controller._routes = {
      ...this._routes,
      [fullPathKey]: route
    } as NewTRoutes;

    return controller;
  }
}
