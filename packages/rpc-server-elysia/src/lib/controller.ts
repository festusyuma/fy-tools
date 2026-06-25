import type {
  AnyController,
  RouteByFullPath,
  RouteFullPath,
} from '@fy-tools/rpc-server';
import type { AnyElysia,Elysia } from 'elysia';

import { Route } from './route';

export class Controller<
  App extends AnyElysia = Elysia,
  Schema extends AnyController = AnyController
> {
  /**
   * Requests.
   * @description Map of all requests in the schema.
   * */
  public R;

  constructor(public _app: App, public _schema: Schema) {
    const path = this._schema._basePath as Schema['_basePath'];
    const routes: Record<string, Route> = {};

    this._app.group(path, (a) => {
      for (const i in _schema._routes_map) {
        routes[i as keyof typeof routes] = new Route(
          a as AnyElysia,
          this._schema._routes[_schema._routes_map[i]]
        );
      }

      return a;
    });

    this.R = new Proxy(
      routes as unknown as {
        [key in RouteFullPath<Schema['_routes'][number]>]: Route<
          App extends Elysia<
            infer _,
            infer Singleton,
            infer Definitions,
            infer Metadata,
            infer Routes,
            infer Ephemeral,
            infer Volatile
          >
            ? Elysia<
                Schema['_basePath'],
                Singleton,
                Definitions,
                Metadata,
                Routes,
                Ephemeral,
                Volatile
              >
            : never,
          RouteByFullPath<Schema['_routes'][number], key>
        >;
      },
      {
        get(target, p, receiver: any) {
          return routes[p as keyof typeof target] as RouteByFullPath<
            Schema['_routes'][number],
            typeof p
          >;
        },
      }
    );
  }

  build<T extends AnyElysia>(fn: (app: App) => T) {
    const newApp = fn(this._app);
    return new Controller<T, Schema>(newApp, this._schema);
  }
}
