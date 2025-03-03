import { z, ZodObject, ZodRawShape } from 'zod';

import { type StripSlashes } from './types.js';
import { HttpMethod } from './util/constants.js';
import { stripSlashes } from './util/strip-slashes.js';

export const ApiSuccessSchema = z.object({
  success: z.boolean().default(true),
});

export class Route<
  TPath extends string = any,
  TMethod extends HttpMethod = any,
  TResponse extends ZodObject<ZodRawShape> | unknown = unknown,
  TBody extends ZodObject<ZodRawShape> | unknown = unknown,
  TParams extends ZodObject<ZodRawShape> | unknown = unknown,
  TQuery extends ZodObject<ZodRawShape> | unknown = unknown,
  TAuth extends boolean = false
> {
  _path: StripSlashes<TPath>;
  _response = z.null() as TResponse;
  _params = z.never() as TParams;
  _query = z.never() as TQuery;
  _body = z.never() as TBody;
  _authorized = false as TAuth;

  constructor(path: TPath, public method: TMethod) {
    this._path = stripSlashes(path);
  }

  body<T extends ZodRawShape>(_schema: T) {
    const schema = z.object(_schema);

    const route = this as unknown as Route<
      TPath,
      TMethod,
      TResponse,
      ZodObject<T>,
      TParams,
      TQuery,
      TAuth
    >;

    route._body = schema;
    return route;
  }

  params<T extends ZodRawShape>(_schema: T) {
    const schema = z.object(_schema);
    const route = this as unknown as Route<
      TPath,
      TMethod,
      TResponse,
      TBody,
      ZodObject<T>,
      TQuery,
      TAuth
    >;

    route._params = schema;

    return route;
  }

  query<T extends ZodRawShape>(_schema: T) {
    const schema = z.object(_schema);
    const route = this as unknown as Route<
      TPath,
      TMethod,
      TResponse,
      TBody,
      TParams,
      ZodObject<T>,
      TAuth
    >;

    route._query = schema;
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

  response<T extends ZodRawShape>(_schema: T) {
    const schema = z.object(_schema);
    const route = this as unknown as Route<
      TPath,
      TMethod,
      ZodObject<T>,
      TBody,
      TParams,
      TQuery,
      TAuth
    >;

    route._response = schema;
    return route;
  }
}
