import { App, Controller, HttpMethod, Route } from '@fy-tools/rpc-server';
import { type } from 'arktype';

const NestApp = new App()
  .controller(
    new Controller('user')
      .route(
        new Route('/:id/update-me/:test', HttpMethod.POST)
          .body(type({ name: 'string' }))
          .query(type({ platform: 'string', state: 'string' }))
          .params(type({ id: 'number' }))
          .response(type({ success: 'boolean' }))
      )
      .route(
        new Route('/', HttpMethod.GET).response(
          type({
            data: type({ name: 'string[]' }),
          })
        )
      )
      .route(
        new Route('/', HttpMethod.POST)
          .body(type({ name: 'string' }))
          .response(type({ success: 'boolean' }))
      )
  )
  .controller(
    new Controller('profile').route(
      new Route('/:id', HttpMethod.PATCH)
        .params(type({ id: 'string' }))
        .body(type({ name: 'string', age: 'number' }))
        .response(type({ updated: 'boolean' }))
    )
  )
  .error(401, type({ error: 'string' }))
  .error(400, type({ errors: 'string[]' }));

export type NestApp = typeof NestApp;
