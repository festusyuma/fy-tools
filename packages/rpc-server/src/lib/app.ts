import type { ZodInterface } from 'zod';

import type { Controller } from './controller.js';

type MergeController<
  T extends readonly Controller[],
  TC extends readonly Controller[]
> = T extends never[] ? TC : [...T, ...TC];

export class App<
  T extends Controller[] = never[],
  TE extends { [k in number]: ZodInterface } = {
    [key in never]: never;
  }
> {
  _controllers = [] as unknown as T;
  _errors = {} as TE;

  controller<TC extends Controller<any, any>>(
    controller: TC
  ): App<MergeController<T, [TC]>, TE> {
    type NewT = MergeController<T, [TC]>;
    const app = this as unknown as App<NewT, TE>;
    app._controllers = [...this._controllers, controller] as NewT;

    return app;
  }

  error<Status extends number, Body extends ZodInterface>(
    status: Status,
    error: Body
  ) {
    const app = this as unknown as App<
      T,
      TE & { [key in Status]: Body }
    >;

    app._errors = { ...app._errors, [status]: error };

    return app;
  }
}
