import type {
  AnyApp,
  AnyController,
  JsonType,
  ParseRoute,
  WithParsedRoute,
} from './types';
import { stripSlashes } from './util/strip-slashes';

export class App<
  T extends object = object,
  TE extends { [k in number]: JsonType } = {
    [key in never]: never;
  }
> {
  _errors = {} as TE;
  _controllers = {} as T;

  controller<TC extends AnyController>(controller: TC) {
    type NewT = T & WithParsedRoute<ParseRoute<TC['_basePath']>, TC>;
    const app = this as unknown as App<NewT, TE>;

    const fullPathKey = `${stripSlashes(controller._basePath) || 'default'}`
      .toLowerCase()
      .replaceAll('-', '_')
      .replaceAll('/', '.')
      .replaceAll(':', '$');

    app._controllers = {
      ...this._controllers,
      [fullPathKey]: controller,
    } as NewT;

    return app;
  }

  app<TA extends AnyApp>(app: TA) {
    type NewT = T & TA['_controllers'];
    let extendedApp = this as AnyApp;

    for (const i in app._controllers) {
      /**
       * extendedApp will finally have the App<NewT, TE>
       *   disabled because the controller type changes after every iteration,
       *   but the final type will be App<NewT, TE>
       **/
      extendedApp = extendedApp.controller(app._controllers[i]);
    }

    return extendedApp as App<NewT, TE>;
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
