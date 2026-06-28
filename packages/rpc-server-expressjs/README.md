# @fy-tools/rpc-server-expressjs

Express adapter for `@fy-tools/rpc-server`. Pass your app schema and an Express instance — routes are registered automatically, request validation is handled for you, and handler context is fully typed.

## Installation

```bash
npm install @fy-tools/rpc-server-expressjs express
```

## Usage

### 1. Define a schema

Use `@fy-tools/rpc-server` to define your API surface. See its [README](../rpc-server/README.md) for full details.

```ts
// schema.ts
import { App, Controller, HttpMethod, Route } from '@fy-tools/rpc-server';
import { z } from 'zod';

export const Schema = new App()
  .controller(
    new Controller('auth')
      .route(
        new Route('login', HttpMethod.POST)
          .body(z.object({ email: z.string(), password: z.string() }))
          .response(z.object({ token: z.string() }))
      )
  )
  .controller(
    new Controller('users')
      .route(
        new Route('/', HttpMethod.GET)
          .response(z.object({
            items: z.array(z.object({ id: z.string(), email: z.string() })),
          }))
      )
      .route(
        new Route(':id', HttpMethod.GET)
          .params(z.object({ id: z.string() }))
          .response(z.object({ id: z.string(), email: z.string() }))
      )
      .route(
        new Route(':id', HttpMethod.DELETE)
          .params(z.object({ id: z.string() }))
      )
  );

export type Schema = typeof Schema;
```

### 2. Create the server

Add any Express middleware before passing the app to `App` — JSON parsing is required for body validation to work.

```ts
import { App } from '@fy-tools/rpc-server-expressjs';
import express from 'express';
import { Schema } from './schema';

const expressApp = express();
expressApp.use(express.json());

const server = new App(expressApp, Schema);
```

> **TypeScript tip:** Always assign `express()` to a named variable before passing it to `App` — as shown above. TypeScript caches the inferred type at the declaration site; passing `express()` inline forces re-evaluation on every completion request and slows down the IDE.

### 3. Implement handlers

Extract each controller to a variable before accessing `.R` — TypeScript computes the controller type once at the declaration site rather than re-evaluating it on every route access. For path encoding rules, see the [rpc-server README](../rpc-server/README.md#path-encoding).

```ts
const auth = server.C.auth;
auth.R.login.POST.handler(async (ctx) => {
  const token = await authenticate(ctx.body.email, ctx.body.password);
  return { token };
});

const users = server.C.users;
users.R.default.GET.handler(async (ctx) => {
  return { items: await db.users.findAll() };
});

users.R.$id.GET.handler(async (ctx) => {
  return db.users.findById(ctx.params.id);
});

users.R.$id.DELETE.handler(async (ctx) => {
  await db.users.delete(ctx.params.id);
});
```

### 4. Start the server

```ts
server._app.listen(3000);
```

---

## Handler context

The context passed to each handler contains:

| Property | Type | Description |
|---|---|---|
| `body` | Inferred from schema | Validated and parsed request body |
| `params` | Inferred from schema | Validated URL path parameters |
| `query` | Inferred from schema | Validated query string parameters |
| `req` | `express.Request` | Raw Express request object |
| `res` | `express.Response` | Raw Express response object |

Validation runs automatically before the handler is called. If body, params, or query fail their schema, the route responds with `400` and a validation error — the handler is not invoked.

The return value of the handler is automatically sent as JSON. If you need to send a custom response (e.g. set headers, stream a file), call `res` directly and return anything — the adapter skips auto-send if headers have already been sent.

---

## API reference

### `App`

```ts
new App(app: Application, schema: AnyApp)
```

Registers all controllers from the schema onto the Express instance.

| Member | Description |
|---|---|
| `.C` | Typed proxy of all controllers, keyed by encoded path |
| `.build(fn)` | Transforms the Express app and returns a new `App` |
| `._app` | The underlying Express instance — call `.listen()` on this |

### `Controller`

Instantiated automatically by `App`. Creates an Express `Router` and mounts it at the controller's base path.

| Member | Description |
|---|---|
| `.R` | Typed proxy of all routes in the controller, keyed by encoded method + path |
| `.build(fn)` | Transforms the Express app and returns a new `Controller` |

### `Route`

Instantiated automatically by `Controller`. Wraps a single route schema.

| Member | Description |
|---|---|
| `.handler(fn)` | Sets the request handler — called from `.R` on a controller |
| `.build(fn)` | Transforms the Express router and returns a new `Route` |
