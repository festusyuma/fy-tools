import type { AxiosError } from 'axios';

import type { InferError } from './types';

export class AppError<
  T,
  TE extends object = InferError<T>,
  TK extends number | 0 = number
> extends Error {
  constructor(public error: AxiosError) {
    super('app error');
  }

  Error(error: (message: TK extends keyof TE ? TE[TK] : any) => void) {
    return error(
      this.error.response?.data as TK extends keyof TE ? TE[TK] : any
    );
  }

  Status<Status extends TK>(status: Status) {
    if (status !== 0 && this.error.status !== status) return;
    return this as unknown as AppError<T, TE, Status>;
  }
}
