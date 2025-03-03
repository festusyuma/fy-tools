import { StripSlashes } from '../types.js';

export function stripSlashes<T extends string | undefined>(value: T) {
  return value?.replace(/^\/+|\/+$/g, '') as StripSlashes<T>;
}
