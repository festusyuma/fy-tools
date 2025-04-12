import type { output,ZodInterface } from 'zod';

import type { Route } from './route.js';

export type StripSlashes<T> = T extends string
  ? T extends `/${infer R}` | `${infer R}/`
    ? StripSlashes<R>
    : T
  : '';

export type RoutePath<TB, T> = T extends string
  ? TB extends string
    ? StripSlashes<`${StripSlashes<TB>}/${StripSlashes<T>}`>
    : StripSlashes<T>
  : never;

export type PropertyKey<T> = T extends ZodInterface
  ? keyof T['def']['shape']
  : never;

type RouteIn<
  T,
  TP extends PropertyKey<T> | undefined = undefined
> = T extends ZodInterface
  ? TP extends PropertyKey<T>
    ? output<T>[TP]
    : output<T>
  : never;

export type Body<
  T extends Route,
  TK extends PropertyKey<T['_body']> | undefined = undefined
> = RouteIn<T['_body'], TK>;

export type Query<
  T extends Route,
  TK extends PropertyKey<T['_query']> | undefined = undefined
> = RouteIn<T['_query'], TK>;

export type Params<
  T extends Route,
  TK extends PropertyKey<T['_params']> | undefined = undefined
> = RouteIn<T['_params'], TK>;
