import { HttpMethod, PropertyKey,Route as _Route } from '@fy-tools/rpc-server';
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
  UseFilters,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { toJSONSchema, ZodInterface } from 'zod';

import { ZodFilter } from './util/zod-filter';

export class Route<
  TPath extends string,
  TMethod extends HttpMethod,
  TResponse extends ZodInterface = never,
  TBody extends ZodInterface = never,
  TParams extends ZodInterface = never,
  TQuery extends ZodInterface = never,
  TAuth extends boolean = false
> extends _Route<TPath, TMethod, TResponse, TBody, TParams, TQuery, TAuth> {
  _decorators = [] as Array<
    ClassDecorator | MethodDecorator | PropertyDecorator
  >;

  constructor(path: TPath, public override method: TMethod) {
    super(path, method);
    this._decorators.push(UseFilters(ZodFilter));
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

  override body<T extends ZodInterface>(_schema: T) {
    const route = super.body(_schema);
    if (route._body)
      this._decorators.push(ApiBody({ schema: toJSONSchema(route._body) }));

    return this as unknown as Route<
      TPath,
      TMethod,
      TResponse,
      T,
      TParams,
      TQuery,
      TAuth
    >;
  }

  override params<T extends ZodInterface>(_schema: T) {
    const route = super.params(_schema);
    if (route._params) {
      const shape = route._params.def.shape;

      for (const p in shape) {
        const paramSchema = shape[p];
        if (!paramSchema) continue;

        const field = toJSONSchema(paramSchema);

        this._decorators.push(ApiParam({ name: p, schema: field }));
      }
    }

    return this as unknown as Route<
      TPath,
      TMethod,
      TResponse,
      TBody,
      T,
      TQuery,
      TAuth
    >;
  }

  override query<T extends ZodInterface>(_schema: T) {
    const route = super.query(_schema);
    if (route._query) {
      const shape = route._query.def.shape;

      for (const q in shape) {
        const querySchema = shape[q];
        if (!querySchema) continue;

        const field = toJSONSchema(querySchema);
        this._decorators.push(ApiQuery({ name: q, schema: field }));
      }
    }

    return this as unknown as Route<
      TPath,
      TMethod,
      TResponse,
      TBody,
      TParams,
      T,
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

  override response<T extends ZodInterface>(_schema: T) {
    const route = super.response(_schema);
    if (route._response) {
      this._decorators.push(
        ApiResponse({
          schema: toJSONSchema(route._response),
          status: HttpStatus.OK,
        })
      );
    }

    return this as unknown as Route<
      TPath,
      TMethod,
      T,
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
    type Key = PropertyKey<TParams> | undefined;

    return createParamDecorator((data: Key, ctx: ExecutionContext) => {
      const paramsData = ctx.switchToHttp().getRequest().params;
      if (this._params instanceof ZodInterface) {
        return data
          ? this._params?.def.shape[data]?._zod.parse(paramsData?.[data], {}) ??
              paramsData?.[data]
          : this._params?.parse(paramsData);
      }

      return data ? paramsData?.[data] : paramsData;
    });
  }

  get Query() {
    type Key = PropertyKey<TQuery> | undefined;

    return createParamDecorator((data: Key, ctx: ExecutionContext) => {
      const queries = ctx.switchToHttp().getRequest().query;

      if (this._query instanceof ZodInterface) {
        return data
          ? this._query?.def.shape[data]?._zod.parse(queries?.[data], {}) ??
              queries?.[data]
          : this._query?.parse(queries);
      }

      return data ? queries?.[data] : queries;
    });
  }

  get Body() {
    type Key = PropertyKey<TBody> | undefined;

    return createParamDecorator((data: Key, ctx: ExecutionContext) => {
      const payload = ctx.switchToHttp().getRequest().body;
      if (this._body instanceof ZodInterface) {
        return data
          ? this._body.def.shape[data]?._zod.parse(payload?.[data], {}) ??
              payload?.[data]
          : this._body.parse(payload);
      }

      return data ? payload?.[data] : payload;
    });
  }
}
