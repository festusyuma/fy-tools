import type { App, Controller } from '@fy-tools/rpc-server';
import Axios, { AxiosError, type AxiosRequestConfig } from 'axios';

import { AppError } from './app-error';
import { methods } from './constants.js';
import type { Client, RpcClientOptions } from './types';

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

  return function client(url: string) {
    return Object.fromEntries(
      Object.entries(methods).map((p) => [
        p[0],
        (payload?: unknown, options?: AxiosRequestConfig) =>
          req(url, p[1], payload, options),
      ])
    );
  } as Client<Routes>;
}
