# @fy-tools/rpc-client-nextjs

Next.js integration for `@fy-tools/rpc-client`. Provides a server-side API factory for Next.js Server Actions and React hooks (`useFetcher`, `useMutation`) for client components — all with full type inference from your schema.

## Installation

```bash
npm install @fy-tools/rpc-client-nextjs @fy-tools/rpc-client
```

## Overview

This package has three entry points:

| Entry point | Usage |
|---|---|
| `@fy-tools/rpc-client-nextjs/server` | `createApiFactory` — used in Server Actions |
| `@fy-tools/rpc-client-nextjs/client` | `useFetcher`, `useMutation` — used in Client Components |
| `@fy-tools/rpc-client-nextjs` | Type exports only (`ApiResponse`, etc.) |

---

## Server Actions

### `createApiFactory(options?)`

Creates a factory for building typed server action wrappers around `rpc-client` route functions. Handles authentication tokens, cache revalidation, and error normalization.

```ts
// app/_api/auth.request.ts
'use server';

import type { Schema } from '@app/schema';
import { InferError, rpcClient } from '@fy-tools/rpc-client';
import { createApiFactory } from '@fy-tools/rpc-client-nextjs/server';
import { redirect } from 'next/navigation';

import { getAuthToken, setAuthToken } from '@/util/auth';

const client = rpcClient<Schema>({ baseURL: process.env.BACKEND_BASE_URL });

async function refreshToken() {
  const token = await getAuthToken();
  if (!token.access && token.refresh) {
    const res = await client.auth.post_refresh__token({
      body: { username: token.username, refreshToken: token.refresh },
    });
    if (res.data.nextStep === 'DONE') {
      await setAuthToken(res.data.authToken);
    }
  }
  if (!(await getAuthToken()).access) redirect('/login');
}

const { createApi } = createApiFactory<InferError<Schema>>({
  getAccessToken: async () => (await getAuthToken()).access,
  refreshToken,
  onAuthorized: () => redirect('/login'),
});

export const login = createApi(client.auth.post_login);
export type login = typeof login.$infer;

export const getUsers = createApi(client.users.get_default);
export type getUsers = typeof getUsers.$infer;

export const createUser = createApi(client.users.post_default, {
  isMutation: true,
  tags: ['users'],
});
export type createUser = typeof createUser.$infer;
```

### `createApiFactory` options (`ClientFactoryPayload`)

| Option | Type | Description |
|---|---|---|
| `getAccessToken` | `() => Promise<string \| undefined> \| string \| undefined` | Returns the current access token |
| `refreshToken` | `() => Promise<void> \| void` | Called when no access token is found; should attempt to refresh |
| `onAuthorized` | `() => Promise<void> \| void` | Called when no access token remains after refresh (e.g. redirect to login) |

### `createApi(fn, options?)`

Wraps a `rpc-client` route function into a server action with auth headers, error handling, and cache control.

```ts
const { createApi } = createApiFactory({ ... });

export const deleteUser = createApi(client.users.delete_$id, {
  isMutation: true,
  tags: ['users'],
  postRequest: async (response, payload) => {
    // runs after a successful (non-error) response
    console.log('Deleted user', payload.params.id);
  },
});
```

#### `createApi` options (`ApiOptions`)

| Option | Type | Default | Description |
|---|---|---|---|
| `authorized` | `false` | — | Set to `false` to skip auth header injection |
| `isMutation` | `true` | — | Triggers `revalidateTag` for all listed `tags` after the call |
| `isFileDownload` | `boolean` | `false` | Sets Axios `responseType: 'blob'` for file downloads |
| `tags` | `string[]` | `[]` | Next.js cache tags to attach (and revalidate if `isMutation`) |
| `postRequest` | `(response, payload) => void` | — | Hook called after a successful response |

### Return value & types

The wrapped function returns `Promise<ApiResponse<T>>` where `T` is inferred from the route's `.response()` schema.

```ts
const result = await login({ body: { username: 'alice', password: 'secret' } });

if ('error' in result) {
  console.error(result.error); // { status, statusText, data, headers }
} else {
  console.log(result.access); // typed as the route's response
}
```

Export both the function and its type so client components can infer payload and response types:

```ts
export const login = createApi(client.auth.post_login);
export type login = typeof login.$infer;
//                              ^^^^^^ provides Body, Params, Query, Response
```

---

## Client Components

Import hooks from the `/client` entry point.

### `useFetcher(key, apiMethod, args, options?, config?)`

SWR hook for fetching data. Calls the server action on mount and returns `data`, `isLoading`, `error`, and a `mutate` function.

```ts
'use client';

import { useFetcher } from '@fy-tools/rpc-client-nextjs/client';
import { getUsers } from '@/api/users.request';

export function UserList() {
  const { data, isLoading, error } = useFetcher(
    ['users'],         // SWR cache key
    getUsers,          // server action
    { query: { page: '1' } } // payload
  );

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Failed to load users</p>;

  return <ul>{data.items.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}
```

#### Parameters

| Parameter | Type | Description |
|---|---|---|
| `key` | `Key` (SWR) | Cache key — used to identify and deduplicate requests |
| `apiMethod` | `ClientApiFunction` | The server action to call |
| `args` | `InferPayload<TF>` | Payload passed to the server action |
| `options` | `InferOptions<TF>` | Optional Axios request config overrides |
| `config` | `SWRConfiguration` | Optional SWR config (merges with defaults) |

Default SWR config: `shouldRetryOnError: false`, `revalidateOnFocus: false`.

---

### `useMutation(key, apiMethod, config?, options?)`

SWR mutation hook for POST/PATCH/DELETE operations. Returns a `trigger` function to call imperatively, plus `isMutating`, `data`, and `error`.

```ts
'use client';

import { useMutation } from '@fy-tools/rpc-client-nextjs/client';
import { login } from '@/api/auth.request';

export function LoginForm() {
  const { trigger, isMutating } = useMutation(['login'], login, {
    onSuccess(data) {
      // data is fully typed based on login's response schema
      console.log('Logged in:', data.access);
    },
    errorMessage: 'Login failed. Please try again.',
  });

  return (
    <button
      disabled={isMutating}
      onClick={() => trigger({ body: { username: 'alice', password: 'secret' } })}
    >
      {isMutating ? 'Logging in...' : 'Log in'}
    </button>
  );
}
```

#### Parameters

| Parameter | Type | Description |
|---|---|---|
| `key` | `Key` (SWR) | Cache key |
| `apiMethod` | `ClientApiFunction` | The server action to call |
| `config` | `SWRMutationConfiguration & { errorMessage?, successMessage? }` | Optional SWR mutation config with extra toast options |
| `options` | `InferOptions<TF>` | Optional Axios request config overrides |

#### Automatic toast notifications

`useMutation` shows error toasts automatically via `react-hot-toast`:

- **400 responses**: Each message in `response.data.message` (array) is shown as a separate toast.
- **Other errors**: Shows `response.data.message`, then `config.errorMessage`, then `'unknown api error'`.

Wrap your app with `<Toaster />` from `react-hot-toast` to enable toasts:

```tsx
import { Toaster } from 'react-hot-toast';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

---

## Type utilities

| Type | Export | Description |
|---|---|---|
| `ApiResponse<T>` | default / server / client | `{ error: unknown } \| T` — the return type of server actions |
| `ClientApiFunction<TF>` | default / server / client | Function signature for a wrapped server action |
| `ClientFactoryPayload` | default / server / client | Options accepted by `createApiFactory` |
| `ApiOptions<TF>` | default / server / client | Options accepted by `createApi` |

Use `ApiResponse<T>` to type server action return values in shared components:

```ts
import type { ApiResponse } from '@fy-tools/rpc-client-nextjs';

type TableFetcher<T extends any[]> = () => Promise<
  ApiResponse<{ items: T; total: number }>
>;
```

---

## Full example

### Server actions

```ts
// app/_api/posts.request.ts
'use server';

import type { Schema } from '@app/schema';
import { InferError, rpcClient } from '@fy-tools/rpc-client';
import { createApiFactory } from '@fy-tools/rpc-client-nextjs/server';
import { redirect } from 'next/navigation';
import { getAuthToken } from '@/util/auth';

const client = rpcClient<Schema>({ baseURL: process.env.BACKEND_BASE_URL });

const { createApi } = createApiFactory<InferError<Schema>>({
  getAccessToken: async () => (await getAuthToken()).access,
  onAuthorized: () => redirect('/login'),
});

export const listPosts = createApi(client.posts.get_default, {
  tags: ['posts'],
});
export type listPosts = typeof listPosts.$infer;

export const createPost = createApi(client.posts.post_default, {
  isMutation: true,
  tags: ['posts'],
});
export type createPost = typeof createPost.$infer;

export const deletePost = createApi(client.posts.delete_$id, {
  isMutation: true,
  tags: ['posts'],
});
export type deletePost = typeof deletePost.$infer;
```

### Client component

```tsx
// app/posts/page.tsx
'use client';

import { useFetcher, useMutation } from '@fy-tools/rpc-client-nextjs/client';
import { listPosts, createPost, deletePost } from '@/api/posts.request';

export default function PostsPage() {
  const { data, isLoading, mutate } = useFetcher(['posts'], listPosts, {});

  const { trigger: create, isMutating: isCreating } = useMutation(
    ['posts', 'create'],
    createPost,
    {
      onSuccess: () => mutate(),
      errorMessage: 'Failed to create post.',
    }
  );

  const { trigger: remove } = useMutation(['posts', 'delete'], deletePost, {
    onSuccess: () => mutate(),
  });

  if (isLoading) return <p>Loading...</p>;

  return (
    <div>
      <button
        disabled={isCreating}
        onClick={() => create({ body: { title: 'New post', content: '...' } })}
      >
        New Post
      </button>
      <ul>
        {data?.items.map((post) => (
          <li key={post.id}>
            {post.title}
            <button onClick={() => remove({ params: { id: post.id } })}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```
