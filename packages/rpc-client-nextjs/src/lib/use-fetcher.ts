import type {
  ApiRouteFunction,
  InferOptions,
  InferPayload,
  InferResponse,
} from '@fy-tools/rpc-client';
import { AxiosError, AxiosResponse } from 'axios';
import useSWR, { type Key, type SWRConfiguration } from 'swr';

import { ClientApiFunction } from './types';

export function useFetcher<
  T extends ClientApiFunction & { $infer: ApiRouteFunction; $error: Error },
  Payload extends InferPayload<T['$infer']>,
  Response extends InferResponse<T['$infer']>
>(
  keys: Key,
  getMethod: T,
  args: Payload,
  options?: InferOptions<T['$infer']>,
  config?: SWRConfiguration<Response, T['$error']>
) {
  return useSWR<Response, T['$error']>(
    keys,
    async () => {
      const res = (await getMethod(args, options)) as Response;
      if (res && typeof res === 'object' && 'error' in res) {
        throw new AxiosError(
          'Api Error',
          undefined,
          options,
          null,
          res.error as unknown as AxiosResponse
        );
      }

      return res as Response;
    },
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
      ...(config ?? {}),
    }
  );
}
