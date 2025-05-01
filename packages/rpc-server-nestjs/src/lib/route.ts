import {
  HttpMethod,
  PropertyKey,
  Route as _Route,
  type JsonType,
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
  UseFilters,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';

import { ArkFilter } from './util/ark-filter';
import type { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { Type, JsonSchema, type } from 'arktype';

export class Route<
  TPath extends string = any,
  TMethod extends HttpMethod = any,
  TResponse extends JsonType | unknown = unknown,
  TBody extends JsonType | unknown = unknown,
  TParams extends JsonType | unknown = unknown,
  TQuery extends JsonType | unknown = unknown,
  TAuth extends boolean = false
> extends _Route<TPath, TMethod, TResponse, TBody, TParams, TQuery, TAuth> {
  _decorators = [] as Array<
    ClassDecorator | MethodDecorator | PropertyDecorator
  >;

  constructor(path: TPath, public override _method: TMethod) {
    super(path, _method);
    this._decorators.push(UseFilters(ArkFilter));
    if (_method === HttpMethod.ALL) this._decorators.push(All(path));
    if (_method === HttpMethod.DELETE) this._decorators.push(Delete(path));
    if (_method === HttpMethod.GET) this._decorators.push(Get(path));
    if (_method === HttpMethod.HEAD) this._decorators.push(All(path));
    if (_method === HttpMethod.POST) this._decorators.push(Post(path));
    if (_method === HttpMethod.PATCH) this._decorators.push(Patch(path));
    if (_method === HttpMethod.OPTIONS) this._decorators.push(Options(path));
    if (_method === HttpMethod.SEARCH) this._decorators.push(Search(path));
    if (_method === HttpMethod.PUT) this._decorators.push(Put(path));
  }

  override body<T extends JsonType>(_schema: T) {
    const route = super.body(_schema);
    if (route._body) {
      this._decorators.push(
        ApiBody({ schema: _schema.toJsonSchema() as SchemaObject })
      );
    }

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

  override params<T extends JsonType>(_schema: T) {
    const route = super.params(_schema);
    if (route._params) {
      const schema = _schema.toJsonSchema() as JsonSchema.Object;

      for (const p in schema.properties) {
        this._decorators.push(
          ApiParam({
            name: p,
            schema: schema.properties[p] as SchemaObject,
            required: schema.required?.includes(p),
          })
        );
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

  override query<T extends JsonType>(_schema: T) {
    const route = super.query(_schema);
    if (route._query) {
      const schema = _schema.toJsonSchema() as JsonSchema.Object;

      for (const p in schema.properties) {
        this._decorators.push(
          ApiQuery({
            name: p,
            schema: schema.properties[p] as SchemaObject,
            required: schema.required?.includes(p),
          })
        );
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

  override response<T extends JsonType>(_schema: T) {
    const route = super.response(_schema);
    if (route._response) {
      this._decorators.push(
        ApiResponse({
          schema: _schema.toJsonSchema() as SchemaObject,
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
      return this.getDataOrField(paramsData, this._params as Type<object>, data);
    });
  }

  get Query() {
    type Key = PropertyKey<TQuery> | undefined;

    return createParamDecorator((data: Key, ctx: ExecutionContext) => {
      const queries = ctx.switchToHttp().getRequest().query;
      return this.getDataOrField(queries, this._query as Type<object>, data);
    });
  }

  get Body() {
    type Key = PropertyKey<TBody> | undefined;

    return createParamDecorator((data: Key, ctx: ExecutionContext) => {
      const payload = ctx.switchToHttp().getRequest().body;
      return this.getDataOrField(payload, this._body as Type<object>, data);
    });
  }

  private getDataOrField<T extends Type<object> | undefined = undefined>(
    payload: any,
    schema: T,
    key: any
  ) {
    if (!(schema instanceof Type)) return key ? payload?.[key] : payload;

    const out = schema(payload);
    if (out instanceof type.errors) return out.throw();

    // @ts-expect-error key not found
    return key ? out[key] : out;
  }
}
