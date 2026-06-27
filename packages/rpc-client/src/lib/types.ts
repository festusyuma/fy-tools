/* eslint-disable @typescript-eslint/no-explicit-any */

import type {
  AnyApp,
  AnyController,
  AnyRoute,
  App,
  Route,
} from '@fy-tools/rpc-server';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import type {
  AxiosError,
  AxiosInstance,
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

export type HttpStatus = (typeof HttpStatusCode)[keyof typeof HttpStatusCode];

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

export type Payload<R> = R extends Route<
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

export type Response<R> = R extends Route<any, any, infer Response>
  ? Response extends StandardSchemaV1<infer _, infer O>
    ? O
    : never
  : any;

type DeepReplace<T> = {
  [K in keyof T]: 0 extends 1 & T[K]
    ? T[K]
    : T[K] extends AnyController
    ? DeepReplace<T[K]['_routes']>
    : T[K] extends AnyRoute
    ? (
        payload: Payload<T[K]>,
        options?: Omit<AxiosRequestConfig<Payload<T[K]>>, 'method' | 'data'>
      ) => Promise<AxiosResponse<Response<T[K]>>>
    : T[K] extends object
    ? DeepReplace<T[K]>
    : T[K];
};

export type Client<Schema extends AnyApp> = DeepReplace<Schema['_controllers']>;

export type { AxiosInstance,AxiosRequestConfig, AxiosResponse };
