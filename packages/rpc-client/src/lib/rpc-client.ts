import { encode } from 'node:querystring';

import type { App, Controller, Route } from '@fy-tools/rpc-server';
import Axios, {
  AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
} from 'axios';
import type { TypeOf, ZodObject, ZodRawShape } from 'zod';

import { AppError } from './app-error';
import { methods } from './constants.js';
import type { RpcClientOptions } from './types';

type ParseSchema<T> = T extends ZodObject<ZodRawShape> ? TypeOf<T> : never;

type IsRoutePath<T, TP extends string> = T extends Route<TP> ? T : never;
type IsRouteMethod<T, TM extends string> = TM extends keyof typeof methods
  ? T extends Route<infer P, TM>
    ? T
    : never
  : never;

type StripNever<T> = {
  [K in keyof T as T[K] extends never ? never : K]: T[K];
};

export function rpcClient<
  T extends App<Controller<any, any>[]>,
  FetcherOptions = Omit<AxiosRequestConfig<T>, 'method' | 'data'>
>(options?: RpcClientOptions) {
  type Controllers = T['_controllers'][number];
  type Routes = Controllers['_routes'][number];

  const axios = Axios.create({
    baseURL: options?.baseUrl,
  });

  async function req(
    url: string,
    method: string,
    payload?: any,
    options?: FetcherOptions
  ) {
    const parsedUrl = (url as string).replace(/:\w+/g, (match) => {
      const param = payload?.params?.[match.slice(1)];
      return param ?? match;
    });

    try {
      return await axios.request({
        url: parsedUrl + `?${encode(payload?.query ?? {})}`,
        method,
        data: payload?.body,
        ...(options ?? {}),
      });
    } catch (e) {
      throw new AppError(e as AxiosError);
    }
  }

  type Payload<R extends Route> = StripNever<{
    body: ParseSchema<R['_body']>;
    params: ParseSchema<R['_params']>;
    query: ParseSchema<R['_query']>;
  }>;

  type PRoute<TPath extends string> = IsRoutePath<Routes, TPath>;
  type MRoute<TPath extends string, M extends string> = IsRouteMethod<
    PRoute<TPath>,
    M
  >;

  return <TPath extends Routes['_path'] & string>(url: TPath) => {
    return Object.fromEntries(
      Object.entries(methods).map((p) => [
        p[0],
        (payload?: unknown, options?: FetcherOptions) =>
          req(url, p[1], payload, options),
      ])
    ) as {
      [key in PRoute<TPath>['method']]: (
        payload: Payload<MRoute<TPath, key>>,
        options?: FetcherOptions
      ) => Promise<
        AxiosResponse<ParseSchema<MRoute<TPath, key>['_response']>>
      >;
    };
  };
}
