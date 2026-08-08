# fy-tools

Type-safe, framework-agnostic tooling for building HTTP APIs in TypeScript. Define your API schema once — routes, methods, and request/response shapes — then share that single source of truth between your server and client with full type inference and no codegen.

This is an [Nx](https://nx.dev) monorepo. Each package below is independently published to npm under the `@fy-tools` scope.

## Packages

### Schema

| Package | Description |
|---|---|
| [`@fy-tools/rpc-server`](packages/rpc-server/README.md) | Framework-agnostic schema definition library. Compose `App`, `Controller`, and `Route` to describe your API surface using any [Standard Schema](https://github.com/standard-schema/standard-schema) compliant validator (arktype, zod, valibot, etc.). |

### Server adapters

Plug an `@fy-tools/rpc-server` schema into your HTTP framework of choice — routes are registered automatically, request validation is handled for you, and handlers are fully typed.

| Package | Framework |
|---|---|
| [`@fy-tools/rpc-server-elysia`](packages/rpc-server-elysia/README.md) | [Elysia](https://elysiajs.com) |
| [`@fy-tools/rpc-server-expressjs`](packages/rpc-server-expressjs/README.md) | [Express](https://expressjs.com) |
| [`@fy-tools/rpc-server-nestjs`](packages/rpc-server-nestjs/README.md) | [NestJS](https://nestjs.com), with automatic Swagger/OpenAPI docs |

### Client

| Package | Description |
|---|---|
| [`@fy-tools/rpc-client`](packages/rpc-client/README.md) | Type-safe HTTP client. Wraps Axios with a proxy that maps your schema directly to typed function calls. |
| [`@fy-tools/rpc-client-nextjs`](packages/rpc-client-nextjs/README.md) | Next.js integration for `rpc-client` — a typed server-action factory plus `useFetcher` / `useMutation` hooks for client components. |

## Quick start

```bash
npm install @fy-tools/rpc-server @fy-tools/rpc-client
```

```ts
// schema.ts
import { App, Controller, HttpMethod, Route } from '@fy-tools/rpc-server';
import { type } from 'arktype';

export const Schema = new App().controller(
  new Controller('users').route(
    new Route('/', HttpMethod.GET).response(
      type({ items: type({ id: 'string', email: 'string' }).array() })
    )
  )
);

export type Schema = typeof Schema;
```

```ts
// client.ts
import { rpcClient } from '@fy-tools/rpc-client';
import type { Schema } from './schema';

const client = rpcClient<Schema>({ baseURL: 'https://api.example.com' });

const res = await client.users.default.GET({});
// res.data → { items: { id: string, email: string }[] }
```

Server-side, pick the adapter for your framework (Elysia, Express, or NestJS) and register the same schema — see each package's README for a full walkthrough.

## Development

```bash
npx nx run-many -t build --parallel   # build all packages
npm publish --access public --workspaces   # publish all packages
```

## License

MIT
