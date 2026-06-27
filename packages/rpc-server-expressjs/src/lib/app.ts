import { AnyApp, Controller as _C, makeFlatProxy } from '@fy-tools/rpc-server';
import type { Application } from 'express';

import { Controller } from './controller';

type ExpressControllerDeepReplace<T, A extends Application> = {
  [K in keyof T]: 0 extends 1 & T[K]
    ? T[K]
    : T[K] extends _C
    ? Controller<A, T[K]>
    : T[K] extends object
    ? ExpressControllerDeepReplace<T[K], A>
    : T[K];
};

export class App<
  ExpressApp extends Application = Application,
  Schema extends AnyApp = AnyApp
> {
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

    type ControllerMap = ExpressControllerDeepReplace<Schema['_controllers'], ExpressApp>;

    this.C = makeFlatProxy(this.controllers) as ControllerMap;
  }

  build<T extends Application>(fn: (app: ExpressApp) => T) {
    return new App<T, Schema>(fn(this._app), this._schema);
  }
}
