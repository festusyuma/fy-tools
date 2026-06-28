# @fy-tools/rpc-server

Framework-agnostic schema definition library for building type-safe HTTP APIs. Define your entire API surface — routes, HTTP methods, request/response shapes — once, then share the schema type between your server and client.

Compatible with any [Standard Schema](https://github.com/standard-schema/standard-schema) compliant validation library (arktype, zod, valibot, etc.).

## Installation

```bash
npm install @fy-tools/rpc-server
```

## Concepts

The schema is built from three composable classes:

| Class | Purpose |
|---|---|
| `Route` | A single HTTP endpoint: method, path, and optional body / params / query / response schemas |
| `Controller` | A group of routes sharing a common base path |
| `App` | Root container that holds all controllers and global error schemas |

---

## `Route`

Defines a single HTTP endpoint. Instantiate it with a path and an HTTP method, then chain schema methods to describe its shape.

```ts
import { Route, HttpMethod } from '@fy-tools/rpc-server';

new Route('login', HttpMethod.POST)
```

### Constructor

```ts
new Route(path: string, method: HttpMethod)
```

Leading and trailing slashes are stripped from `path` automatically.

### Fluent methods

All methods return a new route instance with the updated type so the chain is fully type-safe.

#### `.body(schema)`

Attaches a request body schema. Relevant for `POST`, `PUT`, and `PATCH` routes.

```ts
new Route('login', HttpMethod.POST).body(
  type({ email: 'string.email', password: 'string' })
)
```

#### `.params(schema)`

Attaches a URL path-parameter schema for routes with named segments (`:id`, `:slug`, etc.).

```ts
new Route(':id', HttpMethod.GET).params(
  type({ id: 'string' })
)
```

#### `.query(schema)`

Attaches a query string schema. Query values arrive as strings; use validation pipes to coerce them.

```ts
new Route('/', HttpMethod.GET).query(
  type({ 'page?': 'string', 'size?': 'string' })
)
```

#### `.response(schema)`

Attaches a response body schema. Used for Swagger documentation and client-side type inference — not enforced at runtime.

```ts
new Route('/', HttpMethod.GET).response(
  type({ items: type({ id: 'string' }).array(), total: 'number' })
)
```

#### `.authorized()`

Marks the route as requiring authentication. The NestJS adapter will emit `@ApiBearerAuth()` in the Swagger spec for authorized routes. No authentication enforcement is added by this method itself.

```ts
new Route('/', HttpMethod.GET).authorized()
```

---

## `Controller`

Groups routes under a shared base path.

```ts
import { Controller } from '@fy-tools/rpc-server';

const usersController = new Controller('users')
  .route(
    new Route('/', HttpMethod.GET).authorized().response(...)
  )
  .route(
    new Route(':id', HttpMethod.GET).authorized().params(...)
  );
```

### Constructor

```ts
new Controller(basePath?: string)
```

Omit `basePath` (or pass `undefined`) to register routes at the root. Leading and trailing slashes are stripped automatically.

### `.route(route)`

Adds a route and returns a new controller instance with the updated type.

---

## `App`

The root schema object. Aggregates controllers and global error schemas.

```ts
import { App } from '@fy-tools/rpc-server';

export const Schema = new App()
  .controller(authController)
  .controller(usersController)
  .error(400, type({ error: type('string').array() }))
  .error('default', type({ error: 'string' }));

export type Schema = typeof Schema;
```

### `.controller(controller)`

Registers a controller and returns a new app instance with the updated type.

### `.app(otherApp)`

Merges all controllers from another `App` instance into this one. Useful for splitting schemas across files or packages.

```ts
export const Schema = new App()
  .app(AuthSchema)
  .app(FileSchema)
  .controller(redemptionController);
```

### `.error(status, schema)`

Registers a global error schema for a given HTTP status code. Use the string `'default'` to match any status not explicitly listed. These schemas are surfaced as the `InferError<Schema>` type in `@fy-tools/rpc-client`.

```ts
new App()
  .error(400, type({ error: type('string').array() }))
  .error('default', type({ error: 'string' }))
```

---

## `HttpMethod`

```ts
import { HttpMethod } from '@fy-tools/rpc-server';

HttpMethod.GET     // 'get'
HttpMethod.POST    // 'post'
HttpMethod.PUT     // 'put'
HttpMethod.DELETE  // 'delete'
HttpMethod.PATCH   // 'patch'
HttpMethod.ALL     // 'all'
HttpMethod.OPTIONS // 'options'
HttpMethod.HEAD    // 'head'
HttpMethod.SEARCH  // 'search'
```

---

## Path encoding

Controllers and routes are addressed through a proxy that encodes path segments into valid JavaScript property keys. The same encoding is used by `@fy-tools/rpc-client`.

### Path segment rules

| Path element | Encoded form |
|---|---|
| `/` (path separator) | creates nesting — access via chained properties |
| `:param` (URL parameter) | `$param` |
| empty / root path | `default` |

### Controller keys

A controller is accessed via `App.C.<key>`. For controllers whose base path contains `/`, each segment becomes a chained property.

| Base path | Access |
|---|---|
| `'users'` | `C.users` |
| `''` or `undefined` | `C.default` |
| `'auth/custom'` | `C.auth.custom` |
| `'auth-service'` | `C['auth-service']` |

### Route keys

Routes are accessed via `Controller.R.<path>.<METHOD>`. The path uses the same encoding rules as above; the HTTP method is always **uppercase** and accessed as the final property.

| Route definition | Access on `.R` |
|---|---|
| `GET /` | `.R.default.GET` |
| `POST /` | `.R.default.POST` |
| `POST /login` | `.R.login.POST` |
| `GET /stats/dashboard` | `.R.stats.dashboard.GET` |
| `GET /:id` | `.R.$id.GET` |
| `PUT /voucher-request` | `.R['voucher-request'].PUT` |
| `POST /promo_release` | `.R.promo_release.POST` |

---

## Type utilities

Exported for use when building adapters or typed helpers on top of the schema.

| Type | Description |
|---|---|
| `Body<Route, Key?>` | Infers the validated output type of a route's body schema |
| `Query<Route, Key?>` | Infers the validated output type of a route's query schema |
| `Params<Route, Key?>` | Infers the validated output type of a route's params schema |
| `RouteFullPath<Route>` | Produces the encoded route key (e.g. `get_stats___dashboard`) |
| `ControllerFullPath<Controller>` | Produces the encoded controller key |
| `RouteByFullPath<Routes, Key>` | Resolves a `Route` from a union by its encoded key |
| `ControllerByFullPath<Controllers, Key>` | Resolves a `Controller` from a union by its encoded key |
| `JsonType` | `StandardSchemaV1<object \| []>` — the constraint for all schemas |

---

## Full example

```ts
import { App, Controller, HttpMethod, Route } from '@fy-tools/rpc-server';
import { type } from 'arktype';

const PaginationType = type({
  'page?': type('string').pipe((s) => Number(s ?? 0)),
  'size?': type('string').pipe((s) => Math.min(Number(s ?? 10), 100)),
});

export const Schema = new App()
  .controller(
    new Controller('auth')
      .route(
        new Route('login', HttpMethod.POST)
          .body(type({ email: 'string.email', password: 'string' }))
          .response(type({ access: 'string', refresh: 'string', expiresIn: 'number' }))
      )
  )
  .controller(
    new Controller('users')
      .route(
        new Route('/', HttpMethod.GET)
          .authorized()
          .query(PaginationType)
          .response(
            type({
              items: type({ id: 'string', email: 'string' }).array(),
              total: 'number',
            })
          )
      )
      .route(
        new Route(':id', HttpMethod.GET)
          .authorized()
          .params(type({ id: 'string' }))
          .response(type({ id: 'string', email: 'string' }))
      )
      .route(
        new Route(':id', HttpMethod.DELETE)
          .authorized()
          .params(type({ id: 'string' }))
      )
  )
  .error(400, type({ error: type('string').array() }))
  .error('default', type({ error: 'string' }));

export type Schema = typeof Schema;
```

---

## Server adapters

Once you have a schema, plug it into the adapter for your framework:

| Package | Framework |
|---|---|
| [`@fy-tools/rpc-server-elysia`](../rpc-server-elysia/README.md) | Elysia |
| [`@fy-tools/rpc-server-expressjs`](../rpc-server-expressjs/README.md) | Express |
| [`@fy-tools/rpc-server-nestjs`](../rpc-server-nestjs/README.md) | NestJS |
