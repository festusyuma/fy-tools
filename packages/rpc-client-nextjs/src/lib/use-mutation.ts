import type {
  ApiRouteFunction,
  InferOptions,
  InferPayload,
  InferResponse,
} from '@fy-tools/rpc-client';
import { AxiosError, type AxiosResponse } from 'axios';
import toast from 'react-hot-toast';
import type { Key } from 'swr';
import useSWRMutation, { type SWRMutationConfiguration } from 'swr/mutation';

import { ClientApiFunction } from './types';

export function useMutation<
  T extends ClientApiFunction & { $infer: ApiRouteFunction; $error: Error },
  Payload extends InferPayload<T['$infer']>,
  Response extends InferResponse<T['$infer']>
>(
  keys: Key,
  apiMethod: T,
  config?: SWRMutationConfiguration<Response, T['$error']> & {
    /**
     * Default error message if none was sent from the server
     * */
    errorMessage?: string;
    /**
     * success message if none was sent from the server
     * */
    successMessage?: string;
  },
  options?: InferOptions<T['$infer']>
) {
  return useSWRMutation<Response, T['$error'], Key, Payload>(
    keys,
    async (_key: Key, { arg }: { arg: Payload }) => {
      const res = (await apiMethod(arg, options)) as Response;
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
      throwOnError: false,
      onError(err) {
        if (!(err instanceof AxiosError)) {
          if (config?.errorMessage) toast.error(config.errorMessage);
          return;
        }

        if (err.response?.status !== 400) {
          return toast.error(
            err.response?.data.message ??
              config?.errorMessage ??
              'unknown api error'
          );
        }

        return err.response.data.message.map((i: string) => toast.error(i));
      },
      ...(config ?? {}),
    }
  );
}
