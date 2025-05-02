import { Route } from './route.js';
import { RoutePath, StripSlashes } from './types.js';
import { stripSlashes } from './util/strip-slashes.js';

export type MergeRoute<
  T extends readonly Route[],
  TC extends readonly Route[]
> = T extends never[] ? TC : [...T, ...TC];

export type AddControllerRoute<BPath, T> = T extends Route<
  infer Path,
  infer Method,
  infer Response,
  infer Body,
  infer Params,
  infer Query,
  infer Auth
>
  ? Route<RoutePath<BPath, Path>, Method, Response, Body, Params, Query, Auth>
  : never;

export class Controller<
  BTPath extends string | undefined = any,
  TRoutes extends Route[] = never[]
> {
  _basePath: StripSlashes<BTPath>;
  _routes = [] as unknown as TRoutes;
  _routes_map: Record<string, number> = {};

  constructor(basePath = undefined as BTPath) {
    this._basePath = stripSlashes(basePath);
  }

  route<TR extends Route>(route: TR) {
    type ControllerRoute = AddControllerRoute<BTPath, TR>;
    type NewTRoutes = MergeRoute<TRoutes, [ControllerRoute]>;

    const controller = this as unknown as Controller<BTPath, NewTRoutes>;

    controller._routes = [
      ...this._routes,
      route as unknown as ControllerRoute,
    ] as NewTRoutes;

    const fullPathKey = stripSlashes(
      `${route._method}: ${controller._basePath}/${route._path}`
    );

    this._routes_map[fullPathKey] = controller._routes.length - 1;

    return controller;
  }
}
