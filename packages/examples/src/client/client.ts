import {
  InferError,
  type InferPayload,
  type InferResponse,
  rpcClient,
} from '@fy-tools/rpc-client';

import type { NestApp } from '../server';

export const client = rpcClient<NestApp>({
  /** Use axios instance options here */
  baseURL: 'http://127.0.0.1',
});

export type AppError = InferError<NestApp>;

export const addUser = client.user.post_default;

/** Infer payload type of route */
export type AddUserPayload = InferPayload<typeof addUser>;

/** Infer response type of route */
export type AddUserResponse = InferResponse<typeof addUser>;

export const getUsers = client.user.get_default;
export const updateProfile = client.profile.patch_$id;
