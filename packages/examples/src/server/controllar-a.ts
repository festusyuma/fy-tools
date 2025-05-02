import { Controller, HttpMethod, Route } from '@fy-tools/rpc-server';
import { type } from 'arktype';

const routeA = new Route('/:id/update-me/:test', HttpMethod.POST)
  .body(type({ name: "string" }))
  .query(type({ platform: "string", state: "string" }))
  .params(type({ id: "number" }))
  .response(type({ success: "boolean" }));

const routeB = new Route('/', HttpMethod.GET).response(
  type({
    data: type({ name: "string[]" }),
  })
);

const routeC = new Route('/', HttpMethod.POST)
  .body(type({ name: "string" }))
  .response(type({ success: "boolean" }));

export const controllerA = new Controller('user')
  .route(routeA)
  .route(routeB)
  .route(routeC);
