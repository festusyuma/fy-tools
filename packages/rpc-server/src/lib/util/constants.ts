export const ErrorSchemaKeys = {
  ALL: "ErrorSchema",
  400: "BadRequestSchema",
  401: "UnauthorizedSchema",
  500: "InternalServerErrorSchema",
} as const

export const HttpMethod = {
  GET: '$get',
  POST: '$post',
  PUT: '$put',
  DELETE: '$delete',
  PATCH: '$patch',
  ALL: '$all',
  OPTIONS: '$options',
  HEAD: '$head',
  SEARCH: '$search',
} as const;

export type HttpMethod = (typeof HttpMethod)[keyof typeof HttpMethod];
