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

    const fullPathKey = `${stripSlashes(controller._basePath) || 'default'}`
      .toLowerCase()
      .replaceAll('-', '__')
      .replaceAll('/', '___')
      .replaceAll(':', '$');

    this._controllers_map[fullPathKey] = controllerIndex;

    return app;
  }

  app<TA extends App<Controller<any, any>[]>>(
    app: TA
  ): App<MergeController<T, TA['_controllers']>, TE> {
    type NewT = MergeController<T, TA['_controllers']>;

    let extendedApp = this as unknown as App<NewT, TE>;

    for (const i in app._controllers) {
      /**
       * extendedApp will finally have the App<NewT, TE>
       *   disabled because the controller type changes after every iteration,
       *   but the final type will be App<NewT, TE>
       **/
      // @ts-expect-error invalid type
      extendedApp = extendedApp.controller(app._controllers[i]);
    }

    return extendedApp;
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
