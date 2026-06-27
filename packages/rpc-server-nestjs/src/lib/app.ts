import {
  AnyApp,
  Controller as _C,
  makeFlatProxy,
} from '@fy-tools/rpc-server';

import { Controller } from './controller';
import { AppConfig } from './types';

export class App<Schema extends AnyApp = AnyApp> {
  private controllers: Record<string, Controller<any>> = {};

  /**
   * Controllers.
   * @description Map of all controllers in the schema.
   * */
  public C;

  constructor(public _schema: Schema, config?: AppConfig) {
    for (const i in _schema._controllers) {
      this.controllers[i] = new Controller(_schema._controllers[i], config);
    }

    type DeepReplace<T> = {
      [K in keyof T]: T[K] extends _C
        ? Controller<T[K]>
        : T[K] extends object
        ? DeepReplace<T[K]>
        : T[K];
    };

    type ControllerMap = DeepReplace<Schema['_controllers']>;

    this.C = makeFlatProxy(this.controllers) as ControllerMap;
  }
}
