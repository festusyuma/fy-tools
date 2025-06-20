import type { App, Controller } from '@fy-tools/rpc-server';
import Axios, {
  AxiosInstance,
  type AxiosRequestConfig,
} from 'axios';

import { methods } from './constants.js';
import type { Client, RpcClientOptions } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rpcClient<T extends App<Controller<any, any>[]>>(
  options?: RpcClientOptions
) {
  type Routes = T['_controllers'][number]['_routes'][number];

  const axios = Axios.create(options);

  async function req(
    url: string,
    method: string,
    payload?: object,
    options?: AxiosRequestConfig
  ) {
    const params: Record<string, string | number> = {};
    if (payload && 'params' in payload) Object.assign(params, payload.params);

    const parsedUrl = url.replace(/:\w+/g, (match) => {
      const paramKey = match.slice(1);
      return params[paramKey]?.toString() ?? match;
    });

    let queryString = '';

    if (payload && 'query' in payload) {
      queryString = Object.entries(payload?.query ?? {})
        .filter((i) => !!i[1])
        .map((q) => `${q[0]}=${q[1]}`)
        .join('&');
    }

    return await axios.request({
      method,
      url: parsedUrl + '?' + queryString,
      data: payload && 'body' in payload ? payload?.body : undefined,
      ...(options ?? {}),
    });
  }

  function client(url: string) {
    return Object.fromEntries(
      Object.entries(methods).map((p) => [
        p[0],
        (payload?: object, options?: AxiosRequestConfig) =>
          req(url, p[1], payload, options),
      ])
    );
  }

  return Object.assign(client, { axios }) as Client<Routes> & {
    axios: AxiosInstance;
  };
}
