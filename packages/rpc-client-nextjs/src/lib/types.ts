import type {
  ApiRouteFunction,
  InferOptions,
  InferPayload,
  InferResponse,
} from '@fy-tools/rpc-client';

export type ApiResponse<T> = { error: unknown } | T;

export type ApiOptions<T extends ApiRouteFunction> = {
  authorized?: false;
  isMutation?: true;
  isFileDownload?: boolean;
  tags?: string[];
  postRequest?: (
    response: InferResponse<T>,
    payload: InferPayload<T>
  ) => void | Promise<void>;
};

export type ClientApiFunction<TF extends ApiRouteFunction = any> = (
  payload: InferPayload<TF>,
  options?: InferOptions<TF>
) => Promise<ApiResponse<InferResponse<TF>>>;

export type ClientFactoryPayload = {
  getAccessToken?(): Promise<string | undefined> | string | undefined;
  refreshToken?(): Promise<void> | void;
  onAuthorized?(): Promise<void> | void;
};
