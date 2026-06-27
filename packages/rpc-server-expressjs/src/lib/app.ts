import {
  AnyApp,
  Controller as _C,
  makeFlatProxy,
} from '@fy-tools/rpc-server';
import type { Application } from 'express';

import { Controller } from './controller';

export class App<ExpressApp extends Application = Application, Schema extends AnyApp = AnyApp> {
  private controllers: Record<string, Controller> = {};

  /**
   * Controllers.
   * @description Map of all controllers in the schema.
   * */
  public C;

  constructor(public _app: ExpressApp, public _schema: Schema) {
    for (const i in _schema._controllers) {
      this.controllers[i] = new Controller(this._app, _schema._controllers[i]);
    }

    type DeepReplace<T> = {
      [K in keyof T]: T[K] extends _C
        ? Controller<ExpressApp, T[K]>
        : T[K] extends object
        ? DeepReplace<T[K]>
        : T[K];
    };

    type ControllerMap = DeepReplace<Schema['_controllers']>;

    this.C = makeFlatProxy(this.controllers) as ControllerMap;
  }

  build<T extends Application>(fn: (app: ExpressApp) => T) {
    return new App<T, Schema>(fn(this._app), this._schema);
  }
}
