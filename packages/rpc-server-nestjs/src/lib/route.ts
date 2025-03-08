import {
  HttpMethod,
  type PropertyKey,
  Route as _Route,
} from '@fy-tools/rpc-server';
import {
  All,
  applyDecorators,
  createParamDecorator,
  Delete,
  ExecutionContext,
  Get,
  HttpStatus,
  Options,
  Patch,
  Post,
  Put,
  Search,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { ZodObject, ZodRawShape } from 'zod';

import { zodToApi } from './zod-to-api.js';

export class Route<
  TPath extends string = any,
  TMethod extends HttpMethod = any,
  TResponse extends ZodObject<ZodRawShape> | unknown = unknown,
  TBody extends ZodObject<ZodRawShape> | unknown = unknown,
  TParams extends ZodObject<ZodRawShape> | unknown = unknown,
  TQuery extends ZodObject<ZodRawShape> | unknown = unknown,
  TAuth extends boolean = false
> extends _Route<TPath, TMethod, TResponse, TBody, TParams, TQuery, TAuth> {
  _decorators = [] as Array<
    ClassDecorator | MethodDecorator | PropertyDecorator
  >;

  constructor(path: TPath, public override method: TMethod) {
    super(path, method);
    if (method === HttpMethod.ALL) this._decorators.push(All(path));
    if (method === HttpMethod.DELETE) this._decorators.push(Delete(path));
    if (method === HttpMethod.GET) this._decorators.push(Get(path));
    if (method === HttpMethod.HEAD) this._decorators.push(All(path));
    if (method === HttpMethod.POST) this._decorators.push(Post(path));
    if (method === HttpMethod.PATCH) this._decorators.push(Patch(path));
    if (method === HttpMethod.OPTIONS) this._decorators.push(Options(path));
    if (method === HttpMethod.SEARCH) this._decorators.push(Search(path));
    if (method === HttpMethod.PUT) this._decorators.push(Put(path));
  }

  override body<T extends ZodRawShape>(_schema: T) {
    const route = super.body(_schema);
    this._decorators.push(ApiBody({ schema: zodToApi(route._body) }));

    return this as unknown as Route<
      TPath,
      TMethod,
      TResponse,
      typeof route._body,
      TParams,
      TQuery,
      TAuth
    >;
  }

  override params<T extends ZodRawShape>(_schema: T) {
    const route = super.params(_schema);
    const shape = route._params.shape;

    for (const p in shape) {
      const paramSchema = shape[p];
      if (!paramSchema) continue;

      const field = zodToApi(paramSchema);
      this._decorators.push(
        ApiParam({ name: p, schema: field, required: field.isRequired })
      );
    }

    return this as unknown as Route<
      TPath,
      TMethod,
      TResponse,
      TBody,
      typeof route._params,
      TQuery,
      TAuth
    >;
  }

  override query<T extends ZodRawShape>(_schema: T) {
    const route = super.query(_schema);
    const shape = route._query.shape;

    for (const q in shape) {
      const querySchema = shape[q];
      if (!querySchema) continue;

      const field = zodToApi(querySchema);
      this._decorators.push(
        ApiQuery({ name: q, schema: field, required: field.isRequired })
      );
    }

    return this as unknown as Route<
      TPath,
      TMethod,
      TResponse,
      TBody,
      TParams,
      typeof route._query,
      TAuth
    >;
  }

  override authorized() {
    super.authorized();
    this._decorators.push(ApiBearerAuth());

    return this as unknown as Route<
      TPath,
      TMethod,
      TResponse,
      TBody,
      TParams,
      TQuery,
      true
    >;
  }

  override response<T extends ZodRawShape>(_schema: T) {
    const route = super.response(_schema);
    this._decorators.push(
      ApiResponse({ schema: zodToApi(route._response), status: HttpStatus.OK })
    );

    return this as unknown as Route<
      TPath,
      TMethod,
      typeof route._response,
      TBody,
      TParams,
      TQuery,
      TAuth
    >;
  }

  get Handler() {
    return applyDecorators(...this._decorators);
  }

  get Param() {
    type ParamKey = PropertyKey<TParams> | undefined;

    return createParamDecorator((data: ParamKey, ctx: ExecutionContext) => {
      const paramsData = ctx.switchToHttp().getRequest().params;
      if (this._params instanceof ZodObject) {
        return data
          ? this._params?.shape[data]?.parse(paramsData?.[data]) ??
              paramsData?.[data]
          : this._params?.parse(paramsData);
      }

      return data ? paramsData?.[data] : paramsData;
    });
  }

  get Query() {
    type QueryKey = PropertyKey<TQuery> | undefined;

    return createParamDecorator((data: QueryKey, ctx: ExecutionContext) => {
      const queries = ctx.switchToHttp().getRequest().query;

      if (this._query instanceof ZodObject) {
        return data
          ? this._query?.shape[data]?.parse(queries?.[data]) ?? queries?.[data]
          : this._query?.parse(queries);
      }

      return data ? queries?.[data] : queries;
    });
  }

  get Body() {
    type BodyKey = PropertyKey<TBody> | undefined;

    return createParamDecorator((data: BodyKey, ctx: ExecutionContext) => {
      const payload = ctx.switchToHttp().getRequest().body;
      if (this._body instanceof ZodObject) {
        return data
          ? this._body.shape[data]?.parse(payload?.[data]) ?? payload?.[data]
          : this._body.parse(payload);
      }

      return data ? payload?.[data] : payload;
    });
  }
}
