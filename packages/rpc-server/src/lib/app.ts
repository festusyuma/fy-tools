import type { Controller } from './controller.js';
import { JsonType, RouteByFullPath, RouteFullPath } from './types';

type MergeController<
  T extends readonly Controller[],
  TC extends readonly Controller[]
> = T extends never[] ? TC : [...T, ...TC];

export class App<
  T extends Controller[] = never[],
  TE extends { [k in number]: JsonType } = {
    [key in never]: never;
  }
> {
  _controllers = [] as unknown as T;
  _errors = {} as TE;
  _routesMap: Record<string, [number, number]> = {};

  controller<TC extends Controller<any, any>>(
    controller: TC
  ): App<MergeController<T, [TC]>, TE> {
    type NewT = MergeController<T, [TC]>;

    const app = this as unknown as App<NewT, TE>;
    app._controllers = [...this._controllers, controller] as NewT;
    const controllerIndex = app._controllers.length - 1;

    for (const i in controller._routes_map) {
      this._routesMap[i] = [controllerIndex, controller._routes_map[i]];
    }

    return app;
  }

  error<Status extends number, Body extends JsonType>(
    status: Status,
    error: Body
  ) {
    const app = this as unknown as App<T, TE & { [key in Status]: Body }>;

    app._errors = { ...app._errors, [status]: error };

    return app;
  }

  protected findRoute<
    TRoutes extends (typeof this._controllers)[number]['_routes'][number],
    TPath extends RouteFullPath<TRoutes>,
    TResponse extends RouteByFullPath<TRoutes, TPath>
  >(path: TPath): TResponse {
    const [controllerIndex, routeIndex] = this._routesMap[path];
    return this._controllers[controllerIndex]?._routes[routeIndex];
  }
}
