import type {
  AnyApp,
  ControllerByFullPath,
  ControllerFullPath,
} from '@fy-tools/rpc-server';
import type { AnyElysia } from 'elysia';

import { Controller } from './controller';

export class App<App extends AnyElysia, Schema extends AnyApp> {
  /**
   * Controllers.
   * @description Map of all controllers in the schema.
   * */
  public C = {} as {
    [key in ControllerFullPath<Schema['_controllers'][number]>]: Controller<
      App,
      ControllerByFullPath<Schema['_controllers'][number], key>
    >;
  };

  constructor(public _app: App, public _schema: Schema) {
    for (const i in _schema._controllers_map) {
      this.C[i as keyof typeof this.C] = new Controller(
        this._app,
        _schema._controllers[_schema._controllers_map[i]]
      ) as (typeof this.C)[keyof typeof this.C];
    }
  }

  build<T extends AnyElysia>(fn: (app: App) => T) {
    const newApp = fn(this._app);
    return new App<T, Schema>(newApp, this._schema);
  }
}
