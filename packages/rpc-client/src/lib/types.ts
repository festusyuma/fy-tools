/* eslint-disable @typescript-eslint/no-explicit-any */

import type {
  App,
  Controller,
  ControllerByFullPath,
  ControllerFullPath,
  IsRouteMethod,
  IsRoutePath,
  Route,
  RouteByFullPath,
  RouteFullPath,
} from '@fy-tools/rpc-server';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import type {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  CreateAxiosDefaults,
  HttpStatusCode,
} from 'axios';

export type RpcClientOptions = CreateAxiosDefaults & {
  onSuccess?: (payload: unknown) => unknown;
  onError?: <T extends Error>(e: T) => unknown;
};

export type ApiRouteFunction<Arguments = any, Options = any, Response = any> = (
  arg: Arguments,
  options: Options
) => Promise<Response>;

export type InferPayload<T extends ApiRouteFunction> =
  T extends ApiRouteFunction<infer Payload> ? Payload : never;

export type InferOptions<T extends ApiRouteFunction> =
  T extends ApiRouteFunction<any, infer Options> ? Options : never;

type HttpStatus = (typeof HttpStatusCode)[keyof typeof HttpStatusCode];

export type InferError<T> = T extends App<any, infer Error>
  ? {
      [key in keyof Error]: Error[key] extends StandardSchemaV1<
        infer _,
        infer O
      >
        ? Omit<AxiosError, 'status' | 'response'> & {
            status: key extends 'default'
              ? Exclude<HttpStatus, keyof Error>
              : key;
            response: Omit<AxiosResponse, 'status' | 'data'> & {
              status: key extends 'default'
                ? Exclude<HttpStatus, keyof Error>
                : key;
              data: O;
            };
          }
        : never;
    }[keyof Error]
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
  ? Response extends StandardSchemaV1<infer _, infer O>
    ? O
    : never
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

export type ClientV2<Schema extends App<Controller<any, any>[]>> = {
  [key in ControllerFullPath<Schema['_controllers'][number]>]: {
    [RK in RouteFullPath<
      ControllerByFullPath<
        Schema['_controllers'][number],
        key
      >['_routes'][number]
    >]: <
      Route extends RouteByFullPath<
        ControllerByFullPath<
          Schema['_controllers'][number],
          key
        >['_routes'][number],
        RK
      >,
      P extends Payload<Route>,
      R extends Response<Route>
    >(
      payload: P,
      options?: Omit<AxiosRequestConfig<P>, 'method' | 'data'>
    ) => Promise<AxiosResponse<R>>;
  };
};
