import type { App, Route } from '@fy-tools/rpc-server';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import * as z from 'zod';

import { methods } from './constants';

export type RpcClientOptions = {
  baseUrl?: string;
};

export type ApiRouteFunction<Arguments = any, Options = any, Response = any> = (
  arg: Arguments,
  options: Options
) => Promise<Response>;

export type InferPayload<T extends ApiRouteFunction> =
  T extends ApiRouteFunction<infer Payload> ? Payload : never;

export type InferOptions<T extends ApiRouteFunction> =
  T extends ApiRouteFunction<any, infer Options> ? Options : never;

export type InferError<T> = T extends App<any, infer Error>
  ? {
      [key in keyof Error]: Error[key] extends z.ZodInterface
        ? z.output<Error[key]>
        : never;
    }
  : never;

export type InferResponse<T extends ApiRouteFunction> =
  T extends ApiRouteFunction<any, any, AxiosResponse<infer Response>>
    ? Response
    : never;

type StripNever<T> = {
  [K in keyof T as T[K] extends never ? never : K]: T[K];
};

type IsRoutePath<T extends Route, TP extends string> = T extends Route<TP>
  ? T
  : never;

type IsRouteMethod<
  T extends Route,
  TM extends string
> = TM extends keyof typeof methods
  ? T extends Route<any, TM>
    ? T
    : never
  : never;

type Parse<T> = T extends z.ZodType ? z.output<T> : never;

type Payload<R> = R extends Route<
  any,
  any,
  any,
  infer Body,
  infer Params,
  infer Query
>
  ? StripNever<{
      body: Parse<Body>;
      params: Parse<Params>;
      query: Parse<Query>;
    }>
  : never;

type Response<R> = R extends Route<any, any, infer Response>
  ? Parse<Response>
  : any;

export type Client<R extends Route> = <
  TPath extends R['_path'],
  TRoute extends IsRoutePath<R, TPath>
>(
  path: TPath
) => {
  [key in TRoute['method']]: <
    TMethodRoute extends IsRouteMethod<TRoute, key>,
    TPayload extends Payload<TMethodRoute>,
    TResponse extends Response<TMethodRoute>
  >(
    payload: TPayload,
    options?: Omit<AxiosRequestConfig<TPayload>, 'method' | 'data'>
  ) => Promise<AxiosResponse<TResponse>>;
};
