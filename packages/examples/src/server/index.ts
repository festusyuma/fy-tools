import { App } from '@fy-tools/rpc-server';
import { z } from 'zod';
import { controllerA } from './controllar-a';
import { controllerB } from './controller-b';

const NestApp = new App()
  .controller(controllerA)
  .controller(controllerB)
  .error(401, z.interface({ error: z.string() }))
  .error(400, z.interface({ errors: z.string().array() }));

export type NestApp = typeof NestApp;
