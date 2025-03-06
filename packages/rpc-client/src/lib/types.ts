import type { TypeOf, ZodObject, ZodRawShape } from 'zod';
import type { Route } from '@fy-tools/rpc-server';
import type { HttpMethod } from './constants';
import type { AxiosRequestConfig } from 'axios';

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
