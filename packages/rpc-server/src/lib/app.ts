/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Controller } from './controller.js';
import { JsonType } from './types';
import { stripSlashes } from './util/strip-slashes';

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
  _errors = {} as TE;
  _controllers = [] as unknown as T;
  _controllers_map: Record<string, number> = {};

  controller<TC extends Controller<any, any>>(
    controller: TC
  ): App<MergeController<T, [TC]>, TE> {
    type NewT = MergeController<T, [TC]>;

    const app = this as unknown as App<NewT, TE>;
    app._controllers = [...this._controllers, controller] as NewT;

    const controllerIndex = app._controllers.length - 1;

    const fullPathKey = `${stripSlashes(controller._basePath) || 'DEFAULT'}`
      .toUpperCase()
      .replaceAll('-', '__')
      .replaceAll('/', '___');

    this._controllers_map[fullPathKey] = controllerIndex;

    return app;
  }

  error<Status extends number | 'default', Body extends JsonType>(
    status: Status,
    error: Body
  ) {
    const app = this as unknown as App<T, TE & { [key in Status]: Body }>;

    app._errors = { ...app._errors, [status]: error };

    return app;
  }
}
