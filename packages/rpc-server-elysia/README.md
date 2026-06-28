# @fy-tools/rpc-server-elysia

Elysia adapter for `@fy-tools/rpc-server`. Pass your app schema and an Elysia instance — routes and groups are registered automatically, and handlers are fully type-safe.

## Installation

```bash
npm install @fy-tools/rpc-server-elysia elysia
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

Always assign the Elysia instance to a variable before passing it to `App` — see [TypeScript performance](#typescript-performance) for why this matters.

```ts
import { App } from '@fy-tools/rpc-server-elysia';
import { Elysia } from 'elysia';
import { Schema } from './schema';

const elysia = new Elysia();
const server = new App(elysia, Schema);
```

### 3. Add middleware

Use `.build()` to apply Elysia plugins before handlers run. The returned `App` carries the updated Elysia type, so resolved/derived values are available in every handler.

```ts
const authMiddleware = new Elysia({ name: 'auth' }).resolve(
  { as: 'global' },
  async ({ headers }) => {
    const token = headers.authorization?.split(' ')[1];
    return { userId: await verifyToken(token) };
  }
);

const elysia = new Elysia();
const server = new App(elysia, Schema)
  .build((app) => app.use(authMiddleware));
```

### 4. Implement handlers

Extract each controller to a variable before accessing `.R`. This follows the same TypeScript caching principle as declaring the Elysia instance — TypeScript computes the controller type once at the declaration site rather than re-evaluating it on every route access. For path encoding rules, see the [rpc-server README](../rpc-server/README.md#path-encoding).

```ts
const auth = server.C.auth;
auth.R.login.POST.handler(async (ctx) => {
  const token = await authenticate(ctx.body.email, ctx.body.password);
  return { token };
});

const users = server.C.users;
users.R.default.GET.handler(async (ctx) => {
  return { items: await db.users.findAll({ userId: ctx.userId }) };
});

users.R.$id.GET.handler(async (ctx) => {
  return db.users.findById(ctx.params.id);
});

users.R.$id.DELETE.handler(async (ctx) => {
  await db.users.delete(ctx.params.id);
});
```

`ctx.body`, `ctx.query`, `ctx.params` are typed from the schema. Anything added via `.build()` (e.g. `ctx.userId` above) is also fully typed.

### 5. Start the server

```ts
server._app.listen(3000);
```

---

## TypeScript performance

Elysia uses a 7-parameter generic type to track accumulated routes, plugins, and derived context. When a `new Elysia()` expression is passed **inline** to `App` or `Controller`, TypeScript must infer and expand all 7 parameters as part of the same constructor call — this produces noticeably slow completions as your app grows.

Declaring the instance as a separate variable lets TypeScript compute and cache the type at the declaration site. Subsequent uses of that variable reference the cached type instead of re-evaluating the expression:

```ts
// Slow — Elysia type is inferred inline during the App constructor call
const server = new App(new Elysia(), Schema);

// Fast — TypeScript caches the type at the declaration site
const elysia = new Elysia();
const server = new App(elysia, Schema);
```

The same applies when using `Controller` directly:

```ts
// Slow
const controller = new Controller(new Elysia(), controllerSchema);

// Fast
const elysia = new Elysia();
const controller = new Controller(elysia, controllerSchema);
```

This is TypeScript's own caching behaviour, not specific to this library, but it is especially visible with Elysia because of how large its default type is.

---

## API reference

### `App`

```ts
new App(app: AnyElysia, schema: AnyApp)
```

Registers all controllers from the schema onto the Elysia instance.

| Member | Description |
|---|---|
| `.C` | Typed proxy of all controllers, keyed by encoded path |
| `.build(fn)` | Applies middleware and returns a new `App` with the updated type |
| `._app` | The underlying Elysia instance — call `.listen()` on this |

### `Controller`

Instantiated automatically by `App`. Wraps a single controller schema as an Elysia group.

| Member | Description |
|---|---|
| `.R` | Typed proxy of all routes in the controller, keyed by encoded method + path |
| `.build(fn)` | Applies middleware scoped to this controller |

### `Route`

Instantiated automatically by `Controller`. Wraps a single route schema.

| Member | Description |
|---|---|
| `.handler(fn)` | Sets the request handler — called from `.R` on a controller |
| `.build(fn)` | Applies middleware scoped to this route |
