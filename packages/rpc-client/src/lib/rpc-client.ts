import { encode } from 'node:querystring';

import type { App, Controller, Route } from '@fy-tools/rpc-server';
import Axios, { AxiosError, type AxiosResponse } from 'axios';

import { AppError } from './app-error';
import { methods } from './constants.js';
import type {
  FetcherOptions,
  IsRouteMethod,
  IsRoutePath,
  ParseSchema,
  RpcClientOptions,
  StripNever,
} from './types';

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
      const parsedUrl = (url as string).replace(/:\w+/g, (match) => {
        const param = payload?.params?.[match.slice(1)];
        return param ?? match;
      });

      try {
        return await axios.request<Response>({
          url: parsedUrl + `?${encode(payload?.query ?? {})}`,
          method,
          data: payload?.body,
          ...(options ?? {}),
        });
      } catch (e) {
        throw new AppError(e as AxiosError);
      }
    }

    return Object.fromEntries(
      Object.entries(methods).map((p) => [
        p[0],
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
