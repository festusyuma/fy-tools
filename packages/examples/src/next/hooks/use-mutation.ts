import type {
  ApiRouteFunction,
  InferOptions,
  InferPayload,
  InferResponse,
} from '@fy-tools/rpc-client';
import type { Key } from 'swr';
import useSWRMutation, {
  type SWRMutationConfiguration,
  SWRMutationResponse,
} from 'swr/mutation';

import type { AppError } from '../../client/client';

export function useMutation<T extends ApiRouteFunction>(
  keys: Key,
  apiMethod: T,
  options?: InferOptions<T>,
  config?: SWRMutationConfiguration<InferResponse<T>, AppError>
): SWRMutationResponse<InferResponse<T>, AppError, Key, InferPayload<T>> {
  return useSWRMutation(
    keys,
    async (key: Key, { arg }: { arg: InferPayload<T> }) => {
      const res = await apiMethod(arg, options);
      return res.data as InferResponse<T>;
    },
    {
      throwOnError: false,
      onError(e) {
        switch (e.status) {
          case 400:
            break;
          default:
            console.error(e.response.data);
        }
      },
      ...(config ?? {}),
    }
  );
}
