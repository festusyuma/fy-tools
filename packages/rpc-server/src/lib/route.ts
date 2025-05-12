/* eslint-disable @typescript-eslint/no-explicit-any */

import { JsonType, type StripSlashes } from './types.js';
import { HttpMethod } from './util/constants.js';
import { stripSlashes } from './util/strip-slashes.js';

export class Route<
  TPath extends string = any,
  TMethod extends HttpMethod = any,
  TResponse extends JsonType | unknown = unknown,
  TBody extends JsonType | unknown = unknown,
  TParams extends JsonType | unknown = unknown,
  TQuery extends JsonType | unknown = unknown,
  TAuth extends boolean = any
> {
  _path: StripSlashes<TPath>;
  _response: TResponse | undefined;
  _params: TParams | undefined;
  _query: TQuery | undefined;
  _body: TBody | undefined;
  _authorized = false as TAuth;

  constructor(path: TPath, public _method: TMethod) {
    this._path = stripSlashes(path);
  }

  body<T extends JsonType>(_schema: T) {
    const route = this as unknown as Route<
      TPath,
      TMethod,
      TResponse,
      T,
      TParams,
      TQuery,
      TAuth
    >;

    route._body = _schema;
    return route;
  }

  params<T extends JsonType>(_schema: T) {
    const route = this as unknown as Route<
      TPath,
      TMethod,
      TResponse,
      TBody,
      T,
      TQuery,
      TAuth
    >;

    route._params = _schema;

    return route;
  }

  query<T extends JsonType>(_schema: T) {
    const route = this as unknown as Route<
      TPath,
      TMethod,
      TResponse,
      TBody,
      TParams,
      T,
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

  response<T extends JsonType>(_schema: T) {
    const route = this as unknown as Route<
      TPath,
      TMethod,
      T,
      TBody,
      TParams,
      TQuery,
      TAuth
    >;

    route._response = _schema;
    return route;
  }
}
