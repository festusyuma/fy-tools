import { HttpMethod, Controller, Route } from '@fy-tools/rpc-server';
import * as z from 'zod';

const routeD = new Route('/:id', HttpMethod.PATCH)
  .params(z.interface({ id: z.string() }))
  .body(z.interface({ name: z.string() }))
  .response(z.interface({ updated: z.boolean() }));

export const controllerB = new Controller('profile').route(routeD);
