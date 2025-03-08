import type {
  ApiRouteFunction,
  InferOptions,
  InferPayload,
  InferResponse,
} from '@fy-tools/rpc-client';
import type { Key } from 'swr';
import useSWRMutation, { type SWRMutationConfiguration } from 'swr/mutation';

import type { AppError } from '../../client/client';

export function useMutation<T extends ApiRouteFunction>(
  keys: Key,
  apiMethod: T,
  options?: InferOptions<T>,
  config?: SWRMutationConfiguration<InferResponse<T>, AppError>
) {
  return useSWRMutation<InferResponse<T>, AppError, Key, InferPayload<T>>(
    keys,
    async (key: Key, { arg }: { arg: InferPayload<T> }) => {
      const res = await apiMethod(arg, options);
      return res.data as InferResponse<T>;
    },
    {
      throwOnError: false,
      ...(config ?? {}),
    }
  );
}
