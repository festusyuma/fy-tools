import type {
  ApiRouteFunction,
  InferOptions,
  InferPayload,
  InferResponse,
} from '@fy-tools/rpc-client';
import type { AxiosError, AxiosRequestConfig } from 'axios';
import { revalidateTag } from 'next/cache';

import type {
  ApiOptions,
  ApiResponse,
  ClientApiFunction,
  ClientFactoryPayload,
} from './types';

export function createApiFactory<Error = AxiosError>(
  factoryPayload?: ClientFactoryPayload
) {
  async function parseConfig(options?: {
    tags?: string[];
    isBlob?: boolean;
    authorized?: boolean;
  }) {
    const opt: AxiosRequestConfig = {
      fetchOptions: { next: { tags: options?.tags } },
      headers: {},
    };

    if (options?.isBlob) {
      opt.responseType = 'blob';
    }

    if (typeof options?.authorized === 'undefined') {
      let accessToken = await factoryPayload?.getAccessToken?.();
      if (!accessToken) await factoryPayload?.refreshToken?.();
      accessToken = await factoryPayload?.getAccessToken?.();

      if (!accessToken) factoryPayload?.onAuthorized?.();

      opt.headers = {
        ...(opt.headers ?? {}),
        Authorization: `Bearer ${accessToken}`,
      };
    }

    return opt;
  }

  function parseError(_e: unknown) {
    const e = _e as AxiosError;

    if (!e.response) return { error: {} };

    const headers = Object.fromEntries(
      Object.entries(e.response.headers).map(([k, v]) => [k, String(v)])
    );

    return {
      error: {
        data: e.response.data,
        status: e.response.status,
        statusText: e.response.statusText,
        headers,
      },
    };
  }

  return {
    createApi<TF extends ApiRouteFunction>(
      fn: TF,
      { tags = [], ..._options } = {} as ApiOptions<TF>
    ) {
      return async function (
        payload: InferPayload<TF>,
        options: InferOptions<TF> = {} as InferOptions<TF>
      ): Promise<ApiResponse<InferResponse<TF>>> {
        const opt = await parseConfig({ tags, ..._options });

        if (_options?.isMutation) {
          for (const i in tags) revalidateTag(tags[i], {});
        }

        let res: ApiResponse<InferResponse<TF>>;

        try {
          const _res = await fn(
            {
              body: await payload?.body,
              params: await payload?.params,
              query: payload?.query,
            },
            Object.assign(opt, options)
          );

          res = _res.data;
        } catch (_e) {
          console.log({ _e });
          res = parseError(_e);
        }

        if (typeof res !== 'object' || (res && !('error' in res))) {
          await _options?.postRequest?.(res, payload);
        }

        return res;
      } as ClientApiFunction<TF> & {
        $infer: TF & {
          Body: InferPayload<TF>['body'];
          Params: InferPayload<TF>['params'];
          Query: InferPayload<TF>['query'];
          Response: InferResponse<TF>;
        };
        $error: Error;
      };
    },
  };
}
