# @fy-tools/rpc-client

Type-safe HTTP client for APIs built with `@fy-tools/rpc-server`. Wraps Axios with a proxy that maps your schema structure directly to typed function calls — no codegen required.

## Installation

```bash
npm install @fy-tools/rpc-client @fy-tools/rpc-server
```

## Quick start

```ts
import { rpcClient } from '@fy-tools/rpc-client';
import type { Schema } from './schema';

const client = rpcClient<Schema>({ baseURL: 'https://api.example.com' });

// GET /users?page=1
const res = await client.users.default.GET({ query: { page: '1' } });
// res.data → { items: [...], total: number }

// POST /users
const res = await client.users.default.POST({ body: { email: 'a@b.com', name: 'Alice' } });

// GET /users/:id
const res = await client.users.$id.GET({ params: { id: '123' } });
```

---

## `rpcClient<Schema>(options?)`

Creates a type-safe client proxy. The generic parameter must be the `typeof` your schema (the value returned by `new App()...`).

```ts
const client = rpcClient<Schema>(options);
```

### Options (`RpcClientOptions`)

Extends `CreateAxiosDefaults` (all standard Axios config options are accepted).

```ts
type RpcClientOptions = CreateAxiosDefaults & {
  onSuccess?: (payload: unknown) => unknown;
  onError?: <T extends Error>(e: T) => unknown;
};
```

`onSuccess` and `onError` hooks are reserved for future middleware support.

---

## Calling routes

The client proxy mirrors the schema structure:

```
client.<controller>.<path>.<METHOD>(payload?, axiosOptions?)
```

All segments follow the [path encoding convention](#path-encoding). The HTTP method is always the **last** property and is **uppercase**.

### Payload

Each call accepts a single typed payload object. Only the fields that are defined on the route's schema are accepted.

| Payload key | When required | Description |
|---|---|---|
| `body` | When route has `.body(schema)` | Request body sent as JSON |
| `params` | When route has `.params(schema)` | URL path parameters |
| `query` | When route has `.query(schema)` | Query string parameters |

```ts
// Route: POST /auth/login  (.body)
client.auth.login.POST({ body: { email: '...', password: '...' } });

// Route: GET /redemption  (.query)
client.redemption.default.GET({ query: { page: '1', search: 'foo' } });

// Route: GET /users/:id  (.params)
client.users.$id.GET({ params: { id: 'abc123' } });

// Route with both params and query
client.posts.$id.comments.GET({
  params: { id: '42' },
  query: { page: '1' },
});
```

All calls return `Promise<AxiosResponse<R>>` where `R` is inferred from the route's `.response()` schema.

### Axios options

An optional second argument accepts any Axios request config (except `method` and `data` which are set internally):

```ts
client.users.default.GET(
  { query: { page: '1' } },
  { headers: { Authorization: 'Bearer ...' } }
);
```

---

## Path encoding

Client property keys are derived from the schema using these rules:

| Path element | Encoded form |
|---|---|
| `/` (path separator) | creates nesting — access via chained properties |
| `:param` (URL param) | `$param` |
| empty / root path | `default` |

The HTTP method is always **uppercase** and is the **last** property in the chain. The URL is reconstructed at call time by reversing the encoding and substituting `params` values.

| Schema definition | Client access |
|---|---|
| `Controller('auth')` | `client.auth` |
| `Controller('auth/custom')` | `client.auth.custom` |
| `Controller('')` or `Controller()` | `client.default` |
| `Route('/', GET)` on `users` | `client.users.default.GET(...)` |
| `Route('stats/dashboard', GET)` | `client.stats.dashboard.GET(...)` |
| `Route(':id', GET)` on `users` | `client.users.$id.GET(...)` |
| `Route('voucher-request', POST)` | `client.voucher['voucher-request'].POST(...)` |
| `Route('promo_release', GET)` | `client.promo.promo_release.GET(...)` |

---

## Accessing the Axios instance

The underlying Axios instance is exposed as `client.axios`. Use it to add interceptors or any other Axios configuration after creation.

```ts
const client = rpcClient<Schema>({ baseURL: '...' });

// Add a request interceptor for authentication
client.axios.interceptors.request.use((config) => {
  config.headers['Authorization'] = `Bearer ${getToken()}`;
  return config;
});

// Add HMAC signing
client.axios.interceptors.request.use((config) => {
  const timestamp = Date.now();
  const signature = crypto
    .createHmac('sha256', process.env.API_SECRET)
    .update(`${timestamp}:${JSON.stringify(config.data)}`)
    .digest('hex');

  config.headers['X-Timestamp'] = timestamp;
  config.headers['X-Signature'] = signature;
  return config;
});
```

---

## Error handling

Use `InferError<Schema>` to get a fully typed union of all possible error shapes, derived from the `.error()` calls on your schema.

```ts
import { InferError } from '@fy-tools/rpc-client';
import type { Schema } from './schema';

// Schema defined with:
//   .error(400, type({ error: 'string[]' }))
//   .error('default', type({ error: 'string' }))

type ApiError = InferError<Schema>;
// →
// | AxiosError & { status: 400; response: { status: 400; data: { error: string[] } } }
// | AxiosError & { status: Exclude<HttpStatus, 400>; response: { data: { error: string } } }

try {
  await client.users.default.POST({ body: { email: 'bad', name: '' } });
} catch (e: unknown) {
  const err = e as ApiError;
  if (err.status === 400) {
    console.log(err.response.data.error); // string[]
  } else {
    console.log(err.response.data.error); // string
  }
}
```

---

## Type utilities

| Type | Description |
|---|---|
| `Payload<Route>` | Infers the payload argument type (body / params / query) for a route |
| `Response<Route>` | Infers the response data type for a route |
| `InferError<App>` | Infers the typed error union from an app's `.error()` definitions |
| `InferResponse<ApiRouteFunction>` | Extracts the response type from an `ApiRouteFunction` |
| `InferPayload<ApiRouteFunction>` | Extracts the payload type from an `ApiRouteFunction` |
| `RpcClientOptions` | Options accepted by `rpcClient()` |
| `ClientV2<App>` | The full typed client interface (the proxy type) |

---

## Full example

### Schema

```ts
// schema.ts
import { App, Controller, HttpMethod, Route } from '@fy-tools/rpc-server';
import { type } from 'arktype';

export const Schema = new App()
  .controller(
    new Controller('auth')
      .route(
        new Route('login', HttpMethod.POST)
          .body(type({ email: 'string.email', password: 'string' }))
          .response(type({ access: 'string', refresh: 'string' }))
      )
  )
  .controller(
    new Controller('users')
      .route(
        new Route('/', HttpMethod.GET)
          .authorized()
          .query(type({ 'page?': 'string', 'search?': 'string' }))
          .response(type({ items: type({ id: 'string' }).array(), total: 'number' }))
      )
      .route(
        new Route(':id', HttpMethod.GET)
          .authorized()
          .params(type({ id: 'string' }))
          .response(type({ id: 'string', email: 'string' }))
      )
  )
  .error(400, type({ error: type('string').array() }))
  .error('default', type({ error: 'string' }));

export type Schema = typeof Schema;
```

### Client

```ts
// api.ts
import { InferError, rpcClient } from '@fy-tools/rpc-client';
import type { Schema } from './schema';

const client = rpcClient<Schema>({
  baseURL: process.env.API_BASE_URL,
});

// Attach auth token to every request
client.axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// POST /auth/login
export async function login(email: string, password: string) {
  const res = await client.auth.login.POST({ body: { email, password } });
  return res.data; // { access: string, refresh: string }
}

// GET /users?page=1&search=alice
export async function listUsers(page = 1, search?: string) {
  const res = await client.users.default.GET({
    query: { page: String(page), search },
  });
  return res.data; // { items: [...], total: number }
}

// GET /users/:id
export async function getUser(id: string) {
  const res = await client.users.$id.GET({ params: { id } });
  return res.data; // { id: string, email: string }
}
```
