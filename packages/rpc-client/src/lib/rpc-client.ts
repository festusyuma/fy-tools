import { encode } from 'node:querystring';

import type { App, Controller, Route } from '@fy-tools/rpc-server';
import { methods } from './constants.js';
import type {
  FetcherOptions,
  IsRouteMethod,
  IsRoutePath,
  ParseSchema,
  RpcClientOptions,
  StripNever,
} from './types';
import Axios, { type AxiosResponse } from 'axios';

type Payload<R extends Route> = StripNever<{
  body: ParseSchema<R['_body']>;
  params: ParseSchema<R['_params']>;
  query: ParseSchema<R['_query']>;
}>;

export function rpcClient<T extends App<Controller<any, any>[]>>(
  options?: RpcClientOptions
) {
  type Controllers = T['_controllers'][number];
  type Routes = Controllers['_routes'][number];

  const axios = Axios.create({
    baseURL: options?.baseUrl,
  });

  return <TPath extends Routes['_path']>(url: TPath) => {
    type PRoute = IsRoutePath<Routes, TPath>;

    async function req<Response>(
      method: string,
      payload?: any,
      options?: FetcherOptions
    ) {
      // todo parse url with params

      return axios.request<Response>({
        url: url + `?${encode(payload?.query ?? {})}`,
        method,
        data: payload?.body,
        ...(options ?? {}),
      });
    }

    return Object.fromEntries(
      Object.entries(methods).map((p) => [
        p[1],
        (payload?: unknown, options?: FetcherOptions) =>
          req(p[1], payload, options),
      ])
    ) as {
      [key in PRoute['method']]: (
        payload: Payload<IsRouteMethod<PRoute, key>>,
        options?: FetcherOptions
      ) => Promise<
        AxiosResponse<ParseSchema<IsRouteMethod<PRoute, key>['_response']>>
      >;
    };
  };
}
