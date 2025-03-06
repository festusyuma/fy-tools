import { rpcClient } from '@fy-tools/rpc-client';
import type { NestApp } from '../server-nestjs';

const client = rpcClient<NestApp>({
  /** Use axios instance options here */
  baseUrl: 'https://example.com',
});

client('user')
  /** Type safe payload */
  .$post(
    { body: { name: 'Festus' } },
    {
      /** Use axios request options here */
      headers: {},
    },
  )
  .then((res) => {
    /** Type safe response */
    console.log('res :: ', res.data);
  });

client('user')
  /** Type safe payload */
  .$get({})
  .then((res) => {
    /** Type safe response */
    console.log('res :: ', res.data);
  });
