import { HttpMethod, PropertyKey, Route as _Route } from '@fy-tools/rpc-server';
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
import type { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { StandardSchemaV1 } from '@standard-schema/spec';

import { IssuesFilter } from './util/issues-filter';
import { ValidationError } from './util/validation-error';

// const config = {
//   toJsonSchema: {
//     fallback: {
//       date: (ctx) => ({
//         ...ctx.base,
//         type: 'string',
//         format: 'date-time',
//         description: ctx.after ? `after ${ctx.after.toISOString()}` : 'anytime',
//       }),
//     },
//   },
// };

export class Route<Schema extends _Route<any, any, any, any, any, any, any>> {
  constructor(
    public _schema: Schema,
    private _toJsonSchema?: (schema: unknown) => SchemaObject
  ) {}

  get Handler() {
    const method = this._schema._method;
    const path = this._schema._path;

    const decorators = [];

    decorators.push(UseFilters(IssuesFilter));

    if (method === HttpMethod.ALL) decorators.push(All(path));
    if (method === HttpMethod.DELETE) decorators.push(Delete(path));
    if (method === HttpMethod.GET) decorators.push(Get(path));
    if (method === HttpMethod.HEAD) decorators.push(All(path));
    if (method === HttpMethod.POST) decorators.push(Post(path));
    if (method === HttpMethod.PATCH) decorators.push(Patch(path));
    if (method === HttpMethod.OPTIONS) decorators.push(Options(path));
    if (method === HttpMethod.SEARCH) decorators.push(Search(path));
    if (method === HttpMethod.PUT) decorators.push(Put(path));

    if (this._schema._body && this._toJsonSchema) {
      decorators.push(
        ApiBody({
          schema: this._toJsonSchema(this._schema._body),
        })
      );
    }

    if (this._schema._response && this._toJsonSchema) {
      decorators.push(
        ApiResponse({
          schema: this._toJsonSchema(this._schema._response),
          status: HttpStatus.OK,
        })
      );
    }

    if (this._schema._params && this._toJsonSchema) {
      const schema = this._toJsonSchema(this._schema._params);

      for (const p in schema.properties) {
        decorators.push(
          ApiParam({
            name: p,
            schema: schema.properties[p] as SchemaObject,
            required: schema.required?.includes(p) ?? false,
          })
        );
      }
    }

    if (this._schema._query && this._toJsonSchema) {
      const schema = this._toJsonSchema(this._schema._query);

      for (const p in schema.properties) {
        decorators.push(
          ApiQuery({
            name: p,
            schema: schema.properties[p] as SchemaObject,
            required: schema.required?.includes(p) ?? false,
          })
        );
      }
    }

    if (this._schema._authorized) {
      decorators.push(ApiBearerAuth());
    }

    return applyDecorators(...decorators);
  }

  get Param() {
    type Key = PropertyKey<Schema['_params']> | undefined;

    return createParamDecorator((data: Key, ctx: ExecutionContext) => {
      const paramsData = ctx.switchToHttp().getRequest().params;
      return this.getDataOrField(
        paramsData,
        this._schema._params as StandardSchemaV1,
        data
      );
    });
  }

  get Query() {
    type Key = PropertyKey<Schema['_query']> | undefined;

    return createParamDecorator((data: Key, ctx: ExecutionContext) => {
      const queries = ctx.switchToHttp().getRequest().query;
      return this.getDataOrField(
        queries,
        this._schema._query as StandardSchemaV1,
        data
      );
    });
  }

  get Body() {
    type Key = PropertyKey<Schema['_body']> | undefined;

    return createParamDecorator((data: Key, ctx: ExecutionContext) => {
      const payload = ctx.switchToHttp().getRequest().body;
      return this.getDataOrField(
        payload,
        this._schema._body as StandardSchemaV1,
        data
      );
    });
  }

  private getDataOrField<T extends StandardSchemaV1 | undefined = undefined>(
    payload: any,
    schema: T,
    key: any
  ) {
    if (!schema) return key ? payload?.[key] : payload;

    const out = schema['~standard'].validate(
      payload
    ) as StandardSchemaV1.Result<unknown>;
    if (out.issues) throw new ValidationError(out.issues);

    // @ts-expect-error key not found
    return key ? out.value?.[key] : out.value;
  }
}
