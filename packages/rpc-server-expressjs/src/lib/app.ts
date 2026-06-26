import type {
  AnyApp,
  ControllerByFullPath,
  ControllerFullPath,
} from '@fy-tools/rpc-server';
import type { Application } from 'express';

import { Controller } from './controller';

export class App<ExpressApp extends Application = Application, Schema extends AnyApp = AnyApp> {
  /**
   * Controllers.
   * @description Map of all controllers in the schema.
   * */
  public C = {} as {
    [key in ControllerFullPath<Schema['_controllers'][number]>]: Controller<
      ExpressApp,
      ControllerByFullPath<Schema['_controllers'][number], key>
    >;
  };

  constructor(public _app: ExpressApp, public _schema: Schema) {
    for (const i in _schema._controllers_map) {
      this.C[i as keyof typeof this.C] = new Controller(
        this._app,
        _schema._controllers[_schema._controllers_map[i]]
      ) as (typeof this.C)[keyof typeof this.C];
    }
  }

  build<T extends Application>(fn: (app: ExpressApp) => T) {
    return new App<T, Schema>(fn(this._app), this._schema);
  }
}
