import { Controller, HttpMethod, Route } from '@fy-tools/rpc-server';
import * as z from 'zod';

const routeA = new Route('/:id/update-me/:test', HttpMethod.POST)
  .body(z.interface({ name: z.string() }))
  .query(z.interface({ platform: z.string(), state: z.string() }))
  .params(z.interface({ id: z.number() }))
  .response(z.interface({ success: z.boolean() }));

const routeB = new Route('/', HttpMethod.GET).response(
  z.interface({
    data: z.interface({ name: z.string() }).array(),
  })
);

const routeC = new Route('/', HttpMethod.POST)
  .body(z.interface({ name: z.string() }))
  .response(z.interface({ success: z.boolean() }));

export const controllerA = new Controller('user')
  .route(routeA)
  .route(routeB)
  .route(routeC);
