import { AnyRoute, Response, ValidationError } from '@fy-tools/rpc-server';
import type {
  NextFunction,
  Request,
  Response as ExpressResponse,
  Router,
} from 'express';

import type { RouteToContext } from './types';

export class Route<
  App extends Router = Router,
  Schema extends AnyRoute = AnyRoute
> {
  private _handlerFn: (
    ctx: RouteToContext<Schema>
  ) => Promise<Response<Schema>> = () => {
    throw new Error('Route handler not implemented');
  };

  constructor(public _app: App, public _schema: Schema) {
    const path = this._schema._path ? `/${this._schema._path}` : '/';
    const method = this._schema._method as Schema['_method'];

    this._app = this._app[method](
      path,
      async (req: Request, res: ExpressResponse, next: NextFunction) => {
        let body = req.body;
        let params = req.params;
        let query = req.query;

        if (this._schema._body) {
          const result = await this._schema._body['~standard'].validate(
            req.body
          );

          if (result.issues) throw new ValidationError(result.issues);
          body = result.value;
        }

        if (this._schema._params) {
          const result = await this._schema._params['~standard'].validate(
            req.params
          );

          if (result.issues) throw new ValidationError(result.issues);
          params = result.value;
        }

        if (this._schema._query) {
          const result = await this._schema._query['~standard'].validate(
            req.query
          );

          if (result.issues) throw new ValidationError(result.issues);
          query = result.value;
        }

        const response = await this._handlerFn({
          body,
          params,
          query,
          req,
          res,
        } as RouteToContext<Schema>);

        if (!res.headersSent) res.json(response);
      }
    );
  }

  build<T extends Router>(fn: (app: App) => T) {
    return new Route<T, Schema>(fn(this._app), this._schema);
  }

  handler(fn: (ctx: RouteToContext<Schema>) => Promise<Response<Schema>>) {
    this._handlerFn = fn;
  }
}
