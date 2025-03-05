import { rpcClient } from '@fy-tools/rpc-client';
import type { NestApp } from '../server-nestjs';

const client = rpcClient<NestApp>();
client('user')
  /** Type safe payload */
  .$post({
    body: { name: 'Festus' },
  })
  .then((res) => {
    /** Type safe response */
    console.log('res :: ', res.success);
  });

client('user')
  /** Type safe payload */
  .$get({})
  .then((res) => {
    /** Type safe response */
    console.log('res :: ', res.data);
  });
