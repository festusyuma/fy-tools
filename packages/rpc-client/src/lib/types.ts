import type { App } from '@fy-tools/rpc-server';
import type { Route } from '@fy-tools/rpc-server';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import type { TypeOf, ZodObject, ZodRawShape } from 'zod';

import type { HttpMethod } from './constants';

export type RpcClientOptions = {
  baseUrl?: string;
};

export type ParseSchema<T> = T extends ZodObject<ZodRawShape>
  ? TypeOf<T>
  : never;

export type StripNever<T> = {
  [K in keyof T as T[K] extends never ? never : K]: T[K];
};

export type IsRoutePath<T, TP extends string> = T extends Route<TP> ? T : never;
export type IsRouteMethod<T, TM extends HttpMethod> = T extends Route<
  infer P,
  TM
>
  ? T
  : never;

export type FetcherOptions = Omit<AxiosRequestConfig, 'method' | 'data'>;

export type ApiRouteFunction<
  Arguments = any,
  Options = any,
  Response = any,
> = (arg: Arguments, options: Options) => Promise<Response>;

export type InferPayload<T extends ApiRouteFunction> =
  T extends ApiRouteFunction<infer Payload> ? Payload : never;

export type InferOptions<T extends ApiRouteFunction> =
  T extends ApiRouteFunction<any, infer Options> ? Options : never;

export type InferError<T> = T extends App<any, infer Error>
  ? {
      [key in keyof Error]: Error[key] extends ZodObject<ZodRawShape>
        ? TypeOf<Error[key]>
        : never;
    }
  : never;

export type InferResponse<T extends ApiRouteFunction> =
  T extends ApiRouteFunction<any, any, AxiosResponse<infer Response>>
    ? Response
    : never;
