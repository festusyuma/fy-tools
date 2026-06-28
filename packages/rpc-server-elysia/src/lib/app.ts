import { AnyApp, Controller as _C, makeFlatProxy } from '@fy-tools/rpc-server';
import { type AnyElysia } from 'elysia';

type ElysiaControllerDeepReplace<T, A extends AnyElysia> = {
  [K in keyof T]: 0 extends 1 & T[K]
    ? T[K]
    : T[K] extends _C
    ? Controller<A, T[K]>
    : T[K] extends object
    ? ElysiaControllerDeepReplace<T[K], A>
    : T[K];
};

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

    type ControllerMap = ElysiaControllerDeepReplace<Schema['_controllers'], App>;

    this.C = makeFlatProxy(this.controllers) as ControllerMap;
  }

  build<T extends AnyElysia>(fn: (app: App) => T) {
    const newApp = fn(this._app);
    return new App<T, Schema>(newApp, this._schema);
  }
}
