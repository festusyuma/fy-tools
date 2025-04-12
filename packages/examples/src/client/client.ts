import {
  AppError as _AppError,
  type InferPayload,
  type InferResponse,
  rpcClient,
} from '@fy-tools/rpc-client';

import type { NestApp } from '../server';

export class AppError extends _AppError<NestApp> {}

export const client = rpcClient<NestApp>({
  /** Use axios instance options here */
  baseUrl: 'http://127.0.0.1',
});

export const addUser = client('user').$post;

/** Infer payload type of route */
export type AddUserPayload = InferPayload<typeof addUser>;

/** Infer response type of route */
export type AddUserResponse = InferResponse<typeof addUser>;

export const getUsers = client('user').$get;
export const updateProfile = client('profile/:id').$patch;
