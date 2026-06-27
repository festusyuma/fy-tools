import { AnyApp, Controller as _C, makeFlatProxy } from '@fy-tools/rpc-server';
import { type AnyElysia } from 'elysia';

import { Controller } from './controller';

export class App<App extends AnyElysia, Schema extends AnyApp> {
  private controllers: Record<string, Controller> = {};

  /**
   * Controllers.
   * @description Map of all controllers in the schema.
   * */
  public C;

  constructor(public _app: App, public _schema: Schema) {
    for (const i in _schema._controllers) {
      const controller = new Controller(this._app, _schema._controllers[i]);

      this._app = controller._app;
      this.controllers[i as keyof typeof this.controllers] = controller;
    }

    type DeepReplace<T> = {
      [K in keyof T]: T[K] extends _C
        ? Controller<App, T[K]>
        : T[K] extends object
        ? DeepReplace<T[K]>
        : T[K];
    };

    type ControllerMap = DeepReplace<Schema['_controllers']>;

    this.C = makeFlatProxy(this.controllers) as ControllerMap;
  }

  build<T extends AnyElysia>(fn: (app: App) => T) {
    const newApp = fn(this._app);
    return new App<T, Schema>(newApp, this._schema);
  }
}
