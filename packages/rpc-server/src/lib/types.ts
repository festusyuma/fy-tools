/* eslint-disable @typescript-eslint/no-explicit-any */

import type { StandardSchemaV1 } from '@standard-schema/spec';

import type { Controller } from './controller';
import type { Route } from './route.js';
import type { HttpMethod } from './util/constants';

export type IsRoutePath<
  T extends Route,
  TP extends string
> = T extends Route<TP> ? T : never;

export type IsRouteMethod<
  T extends Route,
  TM extends string
> = TM extends HttpMethod ? (T extends Route<any, TM> ? T : never) : never;

export type RouteFullPath<R> = R extends Route<infer Path, infer Method>
  ? `${Method}_${ParseRoute<Path>}`
  : never;

export type ControllerFullPath<C> = C extends Controller<infer Path, any[]>
  ? ParseRoute<Path>
  : never;

export type ControllerByFullPath<R, Path> = Path extends string
  ? R extends Controller<UnParseRoute<Path>, any>
    ? R
    : never
  : never;

export type ParseRoute<T> = T extends string
  ? T extends ''
    ? 'DEFAULT'
    : T extends `${infer L}/${infer R}`
    ? `${ParseRoute<L>}___${ParseRoute<R>}`
    : T extends `${infer L}-${infer R}`
    ? `${Uppercase<L>}__${ParseRoute<R>}`
    : Uppercase<T>
  : '';

export type UnParseRoute<T> = T extends string
  ? T extends 'DEFAULT'
    ? ''
    : T extends `${infer L}___${infer R}`
    ? `${UnParseRoute<L>}/${UnParseRoute<R>}`
    : T extends `${infer L}__${infer R}`
    ? `${Lowercase<L>}-${UnParseRoute<R>}`
    : Lowercase<T>
  : '';

export type RouteByFullPath<R, P> = P extends `${infer Method}_${infer Path}`
  ? Method extends HttpMethod
    ? R extends Route<UnParseRoute<Path>, Method>
      ? R
      : never
    : never
  : never;

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

export type PropertyKey<T> = T extends StandardSchemaV1<any, infer O>
  ? keyof O
  : never;

type RouteIn<
  T,
  TP extends PropertyKey<T> | undefined = undefined
> = T extends StandardSchemaV1<any, infer O>
  ? TP extends PropertyKey<T>
    ? O[TP]
    : O
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

export type JsonType = StandardSchemaV1<object | []>;
