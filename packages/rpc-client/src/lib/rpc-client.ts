/* eslint-disable @typescript-eslint/no-explicit-any */

import type { AnyApp } from '@fy-tools/rpc-server';
import Axios, { AxiosInstance, type AxiosRequestConfig } from 'axios';

import type { Client, RpcClientOptions } from './types';

export function rpcClient<Schema extends AnyApp>(
  options?: RpcClientOptions
): Client<Schema> & { axios: AxiosInstance } {
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

  const HTTP_METHODS = new Set([
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'HEAD',
    'OPTIONS',
    'SEARCH',
    'ALL',
  ]);

  function makeProxy(path: string): any {
    return new Proxy(
      {},
      {
        get(_, prop) {
          if (prop === 'axios') return axios;
          const segment = prop.toString();

          if (HTTP_METHODS.has(segment)) {
            const originalUrlSegment = path.split('.');
            const urlSegments: string[] = [];

            for (const seg of originalUrlSegment) {
              if (seg === 'default') continue;
              urlSegments.push(seg.replaceAll('$', ':'));
            }

            const url = urlSegments.length ? `/${urlSegments.join('/')}` : '/';

            return (payload?: object, options?: AxiosRequestConfig) =>
              req(url, segment, payload, options);
          }

          return makeProxy(path ? `${path}.${segment}` : segment);
        },
      }
    );
  }

  return makeProxy('') as Client<Schema> & { axios: AxiosInstance };
}
