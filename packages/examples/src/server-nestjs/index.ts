import { App, HttpMethod } from '@fy-tools/rpc-server';
import { Controller, Route } from '@fy-tools/rpc-server-nestjs';
import { z } from 'zod';

const routeA = new Route('/', HttpMethod.POST)
  .body({ name: z.string() })
  .response({ success: z.boolean() });

const routeB = new Route('/', HttpMethod.GET).response({
  data: z.object({ name: z.string() }).array(),
});

const controllerA = new Controller('user').route(routeA).route(routeB);

const routeC = new Route('/:id', HttpMethod.PATCH)
  .params({ id: z.string() })
  .body({ name: z.string() })
  .response({ updated: z.boolean() });

const controllerB = new Controller('profile').route(routeC);

const NestApp = new App().controller(controllerA).controller(controllerB);
export type NestApp = typeof NestApp;
