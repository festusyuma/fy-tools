import type {
  App,
  IsRouteMethod,
  IsRoutePath,
  Route,
} from '@fy-tools/rpc-server';
import { StandardSchemaV1 } from '@standard-schema/spec';
import {
  AxiosRequestConfig,
  AxiosRequestInterceptorUse,
  AxiosResponse,
  AxiosResponseInterceptorUse,
  CreateAxiosDefaults,
  InternalAxiosRequestConfig,
} from 'axios';

export type RpcClientOptions = CreateAxiosDefaults & {
  requestInterceptor?: AxiosRequestInterceptorUse<InternalAxiosRequestConfig>;
  responseInterceptor?: AxiosResponseInterceptorUse<AxiosResponse>;
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
      [key in keyof Error]: Error[key] extends StandardSchemaV1<
        infer _,
        infer O
      >
        ? O
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

type Parse<T> = T extends StandardSchemaV1<infer I, infer _> ? I : never;

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
  ? Response extends StandardSchemaV1<infer _, infer O> ? O : never
  : any;

export type Client<R extends Route> = <
  TPath extends R['_path'],
  TRoute extends IsRoutePath<R, TPath>
>(
  path: TPath
) => {
  [key in TRoute['_method']]: <
    TMethodRoute extends IsRouteMethod<TRoute, key>,
    TPayload extends Payload<TMethodRoute>,
    TResponse extends Response<TMethodRoute>
  >(
    payload: TPayload,
    options?: Omit<AxiosRequestConfig<TPayload>, 'method' | 'data'>
  ) => Promise<AxiosResponse<TResponse>>;
};
