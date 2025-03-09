import type { App } from '@fy-tools/rpc-server';
import type { AxiosResponse } from 'axios';
import type { TypeOf, ZodObject, ZodRawShape } from 'zod';

export type RpcClientOptions = {
  baseUrl?: string;
};

export type ApiRouteFunction<
  Arguments = any,
  Options = any,
  Response = any,
> = (arg: Arguments, options: Options) => Promise<Response>;

export type InferPayload<T extends ApiRouteFunction> =
  T extends ApiRouteFunction<infer Payload> ? Payload : never;

export type InferOptions<T extends ApiRouteFunction> =
  T extends ApiRouteFunction<any, infer Options> ? Options : never;

export type InferError<T> = T extends App<any, infer Error>
  ? {
      [key in keyof Error]: Error[key] extends ZodObject<ZodRawShape>
        ? TypeOf<Error[key]>
        : never;
    }
  : never;

export type InferResponse<T extends ApiRouteFunction> =
  T extends ApiRouteFunction<any, any, AxiosResponse<infer Response>>
    ? Response
    : never;
