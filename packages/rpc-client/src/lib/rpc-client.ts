/* eslint-disable @typescript-eslint/no-explicit-any */

import type { App, Controller } from '@fy-tools/rpc-server';
import Axios, { AxiosInstance, type AxiosRequestConfig } from 'axios';

import type { ClientV2, RpcClientOptions } from './types';

export function rpcClient<Schema extends App<Controller<any, any>[]>>(
  options?: RpcClientOptions
) {
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

  const controllers = {} as ClientV2<Schema> & { axios: AxiosInstance };

  return new Proxy(controllers, {
    get(_, controllerP): any {
      if (controllerP === 'axios') return axios;

      const routes = {};
      return new Proxy(routes, {
        get(_, routeP) {
          const controller = controllerP
            .toString()
            .replaceAll('default', '')
            .replace('___', '/')
            .replaceAll('__', '-')
            .replaceAll('$', ':')
            .toLowerCase();

          const [method, ...route] = routeP
            .toString()
            .replaceAll('default', '')
            .replaceAll('___', '/')
            .replaceAll('__', '-')
            .replaceAll('$', ':')
            .toLowerCase()
            .split('_');

          return (payload?: object, options?: AxiosRequestConfig) =>
            req(
              `${controller}${route?.length ? `/${route.join('_')}` : ''}`,
              method,
              payload,
              options
            );
        },
      });
    },
  });
}
