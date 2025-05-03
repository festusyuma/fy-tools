import {
  App as _App,
  Controller as _Controller,
  ControllerByFullPath,
  RouteByFullPath,
  RouteFullPath,
} from '@fy-tools/rpc-server';

import { Controller } from './controller';
import { Route } from './route';
import { AppConfig } from './types';

export class App<TA extends _App<_Controller<any, any>[]>> {
  _controllers: Record<string, any> = {};
  _routes: Record<string, any> = {};

  constructor(public _schema: TA, config?: AppConfig) {
    for (const i in _schema._controllers) {
      const controller = new Controller(_schema._controllers[i], config);

      this._routes = { ...this._routes, ...controller._routes };
      this._controllers[controller._schema._basePath] = controller;
    }
  }

  getController<
    TControllers extends TA['_controllers'][number],
    TPath extends TControllers['_basePath'],
    TController extends ControllerByFullPath<TControllers, TPath>
  >(path: TPath): Controller<TController> {
    return this._controllers[path];
  }

  getRoute<
    TRoutes extends TA['_controllers'][number]['_routes'][number],
    TPath extends RouteFullPath<TRoutes>,
    TRoute extends RouteByFullPath<TRoutes, TPath>
  >(path: TPath): Route<TRoute> {
    return this._routes[path];
  }
}
