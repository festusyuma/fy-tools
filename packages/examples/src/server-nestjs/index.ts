import { App, HttpMethod } from '@fy-tools/rpc-server';
import { Controller, Route } from '@fy-tools/rpc-server-nestjs';
import { z } from 'zod';

const routeA = new Route('/:id/update/:test', HttpMethod.POST)
  .body({ name: z.string() })
  .query({ platform: z.string(), state: z.string() })
  .params({ id: z.number() })
  .response({ success: z.boolean() });

const routeB = new Route('/', HttpMethod.GET).response({
  data: z.object({ name: z.string() }).array(),
});

const routeC = new Route('/', HttpMethod.POST)
  .body({ name: z.string() })
  .response({ success: z.boolean() });

const controllerA = new Controller('user')
  .route(routeA)
  .route(routeB)
  .route(routeC);

const routeD = new Route('/:id', HttpMethod.PATCH)
  .params({ id: z.string() })
  .body({ name: z.string() })
  .response({ updated: z.boolean() });

const controllerB = new Controller('profile').route(routeD);

const NestApp = new App()
  .controller(controllerA)
  .controller(controllerB)
  .error(401, { error: z.string() })
  .error(400, { errors: z.string().array() });

export type NestApp = typeof NestApp;
