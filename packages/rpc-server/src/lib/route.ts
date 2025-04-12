import { z, ZodInterface } from 'zod';

import { type StripSlashes } from './types.js';
import { HttpMethod } from './util/constants.js';
import { stripSlashes } from './util/strip-slashes.js';

export class Route<
  TPath extends string = any,
  TMethod extends HttpMethod = any,
  TResponse = never,
  TBody = never,
  TParams = never,
  TQuery = never,
  TAuth extends boolean = false
> {
  _path: StripSlashes<TPath>;
  _response: ZodInterface | undefined;
  _params: ZodInterface | undefined;
  _query: ZodInterface | undefined;
  _body: ZodInterface | undefined;
  _authorized = false as TAuth;

  constructor(path: TPath, public method: TMethod) {
    this._path = stripSlashes(path);
  }

  body<T extends ZodInterface>(_schema: T) {
    const route = this as unknown as Route<
      TPath,
      TMethod,
      TResponse,
      z.output<T>,
      TParams,
      TQuery,
      TAuth
    >;

    route._body = _schema;
    return route;
  }

  params<T extends ZodInterface>(_schema: T) {
    const route = this as unknown as Route<
      TPath,
      TMethod,
      TResponse,
      TBody,
      z.output<T>,
      TQuery,
      TAuth
    >;

    route._params = _schema;

    return route;
  }

  query<T extends ZodInterface>(_schema: T) {
    const route = this as unknown as Route<
      TPath,
      TMethod,
      TResponse,
      TBody,
      TParams,
      z.output<T>,
      TAuth
    >;

    route._query = _schema;
    return route;
  }

  authorized() {
    const route = this as unknown as Route<
      TPath,
      TMethod,
      TResponse,
      TBody,
      TParams,
      TQuery,
      true
    >;

    route._authorized = true;

    return route;
  }

  response<T extends ZodInterface>(_schema: T) {
    const route = this as unknown as Route<
      TPath,
      TMethod,
      z.output<T>,
      TBody,
      TParams,
      TQuery,
      TAuth
    >;

    route._response = _schema;
    return route;
  }
}
