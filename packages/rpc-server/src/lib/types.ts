/* eslint-disable @typescript-eslint/no-explicit-any */

import type { StandardSchemaV1 } from '@standard-schema/spec';

import type { App } from './app.js';
import type { Controller } from './controller';
import type { Route } from './route.js';
import type { HttpMethod } from './util/constants';

export type AnyRoute = Route<any, any, any, any, any, any, any>;
export type AnyController = Controller<any, any>;
export type AnyApp = App<any, any>;

export type IsRoutePath<
  T extends Route,
  TP extends string
> = T extends Route<TP> ? T : never;

export type IsRouteMethod<
  T extends Route,
  TM extends string
> = TM extends HttpMethod ? (T extends Route<any, TM> ? T : never) : never;

export type RouteFullPath<R> = R extends Route<infer Path, infer Method>
  ? ParseRoute<Path> extends object
    ? ParseRoute<Path>
    : `${Method}$$${Path}`
  : never;

export type ControllerFullPath<C> = C extends Controller<infer Path, any[]>
  ? ParseRoute<Path>
  : never;

export type ControllerByFullPath<R, Path> = Path extends string
  ? // ? R extends Controller<UnParseRoute<Path>, any>
    R extends Controller<Path, any>
    ? R
    : never
  : never;

export type ParseRoute<UT, Path extends object = object> = UT extends string
  ? StripSlashes<UT> extends infer T
    ? T extends '' | undefined
      ? Path & { default: true }
      : T extends `${infer L}-${infer R}`
      ? ParseRoute<`${L}_${R}`, Path>
      : T extends `${infer L}:${infer R}`
      ? ParseRoute<`${L}$${R}`, Path>
      : T extends `${infer L}/${infer R}`
      ? Path & { [NP in L]: ParseRoute<R> }
      : Path & { [A in T extends string ? T : never]: true }
    : Path
  : Path;

export type WithParsedRoute<T extends object, W> = {
  [K in keyof T]: T[K] extends true
    ? W
    : T[K] extends object
    ? WithParsedRoute<T[K], W>
    : T[K];
};

export type RouteByFullPath<R, P> = P extends `${infer Method}$$${infer Path}`
  ? Method extends HttpMethod
    ? // ? R extends Route<UnParseRoute<Path>, Method>
      R extends Route<Path, Method>
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

export type Response<
  T extends Route,
  TK extends PropertyKey<T['_response']> | undefined = undefined
> = RouteIn<T['_response'], TK>;

export type Query<
  T extends Route,
  TK extends PropertyKey<T['_query']> | undefined = undefined
> = RouteIn<T['_query'], TK>;

export type Params<
  T extends Route,
  TK extends PropertyKey<T['_params']> | undefined = undefined
> = RouteIn<T['_params'], TK>;

export type JsonType = StandardSchemaV1<object | []>;
