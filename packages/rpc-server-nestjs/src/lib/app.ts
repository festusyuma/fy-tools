import {
  App as _App,
  Controller as _Controller,
  ControllerByFullPath,
  ControllerFullPath,
} from '@fy-tools/rpc-server';

import { Controller } from './controller';
import { AppConfig } from './types';

export class App<Schema extends _App<_Controller<any, any>[]>> {
  /**
   * Controllers.
   * @description Map of all controllers in the schema.
   * */
  public C: {
    [key in ControllerFullPath<Schema['_controllers'][number]>]: Controller<
      ControllerByFullPath<Schema['_controllers'][number], key>
    >;
  } = {} as {
    [key in ControllerFullPath<Schema['_controllers'][number]>]: Controller<
      ControllerByFullPath<Schema['_controllers'][number], key>
    >;
  };

  constructor(public _schema: Schema, config?: AppConfig) {
    for (const i in _schema._controllers_map) {
      this.C[i as keyof typeof this.C] = new Controller(
        _schema._controllers[_schema._controllers_map[i]],
        config
      ) as (typeof this.C)[keyof typeof this.C];
    }
  }
}
