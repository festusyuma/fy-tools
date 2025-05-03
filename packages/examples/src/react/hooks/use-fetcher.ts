import type {
  ApiRouteFunction,
  InferOptions,
  InferPayload,
  InferResponse,
} from '@fy-tools/rpc-client';
import useSWR, { type Key, type SWRConfiguration } from 'swr';

import { AppError } from '../../client/client';

export function useFetcher<T extends ApiRouteFunction>(
  keys: Key,
  getMethod: T,
  args: InferPayload<T>,
  options?: InferOptions<T>,
  config?: SWRConfiguration
) {
  return useSWR<InferResponse<T>, AppError>(
    keys,
    async () => {
      const res = await getMethod(args, options);
      return res.data as InferResponse<T>;
    },
    {
      shouldRetryOnError: false,
      revalidateOnFocus: false,
      ...(config ?? {}),
    }
  );
}
