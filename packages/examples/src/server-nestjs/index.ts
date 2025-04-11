import { App, HttpMethod } from '@fy-tools/rpc-server';
import { Controller, Route } from '@fy-tools/rpc-server-nestjs';
import { z } from 'zod';

const routeA = new Route('/:id/update/:test', HttpMethod.POST)
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

const controllerA = new Controller('user')
  .route(routeA)
  .route(routeB)
  .route(routeC);

const routeD = new Route('/:id', HttpMethod.PATCH)
  .params(z.interface({ id: z.string() }))
  .body(z.interface({ name: z.string() }))
  .response(z.interface({ updated: z.boolean() }));

const controllerB = new Controller('profile').route(routeD);

const NestApp = new App()
  .controller(controllerA)
  .controller(controllerB)
  .error(401, z.interface({ error: z.string() }))
  .error(400, z.interface({ errors: z.string().array() }));

export type NestApp = typeof NestApp;
