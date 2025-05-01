import { App } from '@fy-tools/rpc-server';

import { controllerA } from './controllar-a';
import { controllerB } from './controller-b';
import { type } from 'arktype';

const NestApp = new App()
  .controller(controllerA)
  .controller(controllerB)
  .error(401, type({ error: "string" }))
  .error(400, type({ errors: "string[]" }));

export type NestApp = typeof NestApp;
