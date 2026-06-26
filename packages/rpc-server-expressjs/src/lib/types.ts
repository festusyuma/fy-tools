import type { AnyRoute, Body, Params, Query } from '@fy-tools/rpc-server';
import type { NextFunction, Request, Response } from 'express';

export type RouteToContext<Schema extends AnyRoute> = {
  body: Body<Schema>;
  params: Params<Schema>;
  query: Query<Schema>;
  req: Request;
  res: Response;
  next: NextFunction;
};
