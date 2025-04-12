import type { App, Controller, Route } from '@fy-tools/rpc-server';
import Axios, {
  AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
} from 'axios';

import { AppError } from './app-error';
import { methods } from './constants.js';
import type { RpcClientOptions } from './types';

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

type Payload<R> = R extends Route<
  any,
  any,
  any,
  infer Body,
  infer Params,
  infer Query
>
  ? StripNever<{
      body: Body;
      params: Params;
      query: Query;
    }>
  : never;

type Response<R> = R extends Route<any, any, infer Response> ? Response : any;

type Client<R extends Route> = {
  [key in R['method']]: <
    TMethodRoute extends IsRouteMethod<R, key>,
    TPayload extends Payload<TMethodRoute>,
    TResponse extends Response<TMethodRoute>
  >(
    payload: TPayload,
    options?: Omit<AxiosRequestConfig<TPayload>, 'method' | 'data'>
  ) => Promise<AxiosResponse<TResponse>>;
};

export function rpcClient<T extends App<Controller<any, any>[]>>(
  options?: RpcClientOptions
) {
  type Routes = T['_controllers'][number]['_routes'][number];

  const axios = Axios.create({
    baseURL: options?.baseUrl,
  });

  async function req(
    url: string,
    method: string,
    payload?: any,
    options?: AxiosRequestConfig
  ) {
    const parsedUrl = (url as string).replace(/:\w+/g, (match) => {
      const param = payload?.params?.[match.slice(1)];
      return param ?? match;
    });

    const queryString = Object.entries(payload?.query ?? {})
      .map((q) => `${q[0]}=${q[1]}`)
      .join('&');

    try {
      return await axios.request({
        url: parsedUrl + '?' + queryString,
        method,
        data: payload?.body,
        ...(options ?? {}),
      });
    } catch (e) {
      throw new AppError(e as AxiosError);
    }
  }

  return function client<
    TPath extends Routes['_path'],
    TRoute extends IsRoutePath<Routes, TPath>
  >(url: TPath): Client<TRoute> {
    return Object.fromEntries(
      Object.entries(methods).map((p) => [
        p[0],
        (payload?: unknown, options?: AxiosRequestConfig) =>
          req(url, p[1], payload, options),
      ])
    ) as Client<TRoute>;
  };
}
