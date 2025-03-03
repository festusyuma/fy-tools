import type { Controller } from './controller.js';

type MergeController<
  T extends readonly Controller[],
  TC extends readonly Controller[]
> = T extends never[] ? TC : [...T, ...TC];

export class App<T extends Controller[] = never[]> {
  _controllers = [] as unknown as T;

  controller<TC extends Controller<any, any>>(
    controller: TC
  ): App<MergeController<T, [TC]>> {
    type NewT = MergeController<T, [TC]>;
    const app = this as unknown as App<NewT>;
    app._controllers = [...this._controllers, controller] as NewT

    return app;
  }
}
