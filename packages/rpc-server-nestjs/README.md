# @fy-tools/rpc-server-nestjs

NestJS adapter for `@fy-tools/rpc-server`. Wraps a schema defined with `@fy-tools/rpc-server` and produces NestJS-compatible decorators for controllers and route handlers, plus automatic Swagger/OpenAPI documentation.

## Installation

```bash
npm install @fy-tools/rpc-server-nestjs @fy-tools/rpc-server
```

## Overview

The adapter mirrors the three-class structure of `@fy-tools/rpc-server`:

| Class | NestJS surface |
|---|---|
| `App` | Container; exposes a typed `C` map of NestJS `Controller` wrappers |
| `Controller` | Exposes a `.Controller` decorator getter and a typed `R` map of `Route` wrappers |
| `Route` | Exposes `.Handler`, `.Body`, `.Query`, `.Param` decorator/param-decorator getters |

Validation is done inside the param decorators using the Standard Schema `validate()` method. Validation failures throw a `ValidationError` which is caught by `IssuesFilter` and returned as HTTP 400.

---

## `App`

Instantiate once (typically in a module file) by passing your schema.

```ts
import { App } from '@fy-tools/rpc-server-nestjs';
import { Schema } from './schema';

export const RpcApp = new App(Schema);
// or with Swagger JSON schema conversion:
export const RpcApp = new App(Schema, { toJsonSchema });
```

### Constructor

```ts
new App(schema: BaseApp, config?: AppConfig)
```

`AppConfig` is optional:

```ts
type AppConfig = {
  toJsonSchema: (schema: unknown) => SchemaObject;
};
```

Pass `toJsonSchema` to enable automatic `@ApiBody`, `@ApiQuery`, `@ApiParam`, and `@ApiResponse` decorators on every route. Any function that converts a Standard Schema object to a JSON Schema object (e.g. from `@anatine/zod-openapi`, `arktype-openapi`, etc.) works here.

### `App.C`

A fully typed map of `Controller` instances keyed by the [encoded controller path](../rpc-server/README.md#path-encoding).

```ts
RpcApp.C.users          // Controller for 'users' base path
RpcApp.C.auth___custom  // Controller for 'auth/custom' base path
RpcApp.C.default        // Controller with no base path
```

---

## `Controller`

Accessed via `App.C`. Do not instantiate directly.

### `controller.Controller`

A NestJS class decorator. Apply it to your NestJS controller class. It emits `@Controller(basePath)` with the base path from the schema.

```ts
@RpcApp.C.users.Controller
@Controller() // ← do NOT add this; .Controller already applies it
export class UsersController { ... }
```

> `controller.Controller` calls `applyDecorators(NestJS_Controller(basePath))` internally. Do not stack an additional `@Controller()`.

### `controller.R`

A fully typed map of `Route` instances keyed by the [encoded route key](../rpc-server/README.md#path-encoding).

```ts
RpcApp.C.users.R.get_default    // GET /
RpcApp.C.users.R.get_$id        // GET /:id
RpcApp.C.users.R.post_default   // POST /
```

---

## `Route`

Accessed via `Controller.R`. Do not instantiate directly.

### `route.Handler`

A NestJS method decorator. Apply it to your handler method. It:

- Adds the HTTP method decorator (`@Get`, `@Post`, `@Put`, etc.) with the route path from the schema.
- Applies `@UseFilters(IssuesFilter)` so validation errors are caught automatically.
- Emits Swagger decorators (`@ApiBody`, `@ApiQuery`, `@ApiParam`, `@ApiResponse`, `@ApiBearerAuth`) when `toJsonSchema` is configured and the route has the corresponding schemas.

```ts
@RpcApp.C.users.R.get_$id.Handler
async getUser(...) { ... }
```

### `route.Body`

A NestJS param decorator factory. Validates the request body against the route's body schema and injects the parsed value. Optionally accepts a key to extract a single property.

```ts
// Inject the full validated body
async createUser(@RpcApp.C.users.R.post_default.Body() body: Body<...>) { ... }

// Inject a single field
async createUser(@RpcApp.C.users.R.post_default.Body('email') email: string) { ... }
```

### `route.Query`

A NestJS param decorator factory. Validates the query string against the route's query schema and injects the parsed value. Accepts an optional key.

```ts
async listUsers(@RpcApp.C.users.R.get_default.Query() query: Query<...>) { ... }
async listUsers(@RpcApp.C.users.R.get_default.Query('page') page: number) { ... }
```

### `route.Param`

A NestJS param decorator factory. Validates URL path parameters against the route's params schema and injects the parsed value. Accepts an optional key.

```ts
async getUser(@RpcApp.C.users.R.get_$id.Param() params: Params<...>) { ... }
async getUser(@RpcApp.C.users.R.get_$id.Param('id') id: string) { ... }
```

---

## `ValidationError`

Thrown by the param decorators when schema validation fails.

```ts
import { ValidationError } from '@fy-tools/rpc-server-nestjs';

class ValidationError extends Error {
  issues: ReadonlyArray<StandardSchemaV1.Issue>;
}
```

### `IssuesFilter`

A NestJS exception filter that catches `ValidationError` and responds with HTTP 400:

```json
{
  "error": "validation error: validation error",
  "issues": [ ... ]
}
```

`IssuesFilter` is applied automatically via `@UseFilters` on every route handler when you use `route.Handler`. You do not need to register it manually unless you want global coverage.

---

## Full example

### `schema.ts`

```ts
import { App, Controller, HttpMethod, Route } from '@fy-tools/rpc-server';
import { type } from 'arktype';

export const Schema = new App()
  .controller(
    new Controller('users')
      .route(
        new Route('/', HttpMethod.POST)
          .body(type({ email: 'string.email', name: 'string' }))
          .response(type({ id: 'string', email: 'string', name: 'string' }))
      )
      .route(
        new Route('/', HttpMethod.GET)
          .authorized()
          .query(type({ 'page?': 'string' }))
          .response(type({ items: type({ id: 'string' }).array(), total: 'number' }))
      )
      .route(
        new Route(':id', HttpMethod.GET)
          .authorized()
          .params(type({ id: 'string' }))
          .response(type({ id: 'string', email: 'string', name: 'string' }))
      )
  )
  .error(400, type({ error: type('string').array() }))
  .error('default', type({ error: 'string' }));

export type Schema = typeof Schema;
```

### `rpc-app.ts`

```ts
import { App } from '@fy-tools/rpc-server-nestjs';
import { toJsonSchema } from 'arktype-openapi'; // or any converter
import { Schema } from './schema';

export const RpcApp = new App(Schema, { toJsonSchema });
```

### `users.controller.ts`

```ts
import { Body, Params, Query } from '@fy-tools/rpc-server';
import { Controller } from '@nestjs/common';
import { RpcApp } from './rpc-app';
import { UsersService } from './users.service';

const C = RpcApp.C.users;

@C.Controller
export class UsersController {
  constructor(private users: UsersService) {}

  @C.R.post_default.Handler
  async create(@C.R.post_default.Body() body: Body<typeof C.R.post_default._schema>) {
    return this.users.create(body);
  }

  @C.R.get_default.Handler
  async list(@C.R.get_default.Query() query: Query<typeof C.R.get_default._schema>) {
    return this.users.findAll(query);
  }

  @C.R.get_$id.Handler
  async getOne(@C.R.get_$id.Param('id') id: string) {
    return this.users.findById(id);
  }
}
```

### `users.module.ts`

```ts
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
```
