import { Controller, HttpMethod, Route } from '@fy-tools/rpc-server';
import { type } from 'arktype';

const routeD = new Route('/:id', HttpMethod.PATCH)
  .params(type({ id: "string" }))
  .body(type({ name: "string", age: "number" }))
  .response(type({ updated: "boolean" }));

export const controllerB = new Controller('profile').route(routeD);
