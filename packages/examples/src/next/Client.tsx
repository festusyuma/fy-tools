import { useEffect, useState } from 'react';

import { addUser, getUsers } from '../client/client';
import { useFetcher } from './hooks/use-fetcher';
import { useMutation } from './hooks/use-mutation';

export function Client() {
  const { data } = useFetcher(['users'], getUsers, {});
  const { trigger } = useMutation(
    ['users'],
    addUser,
    { headers: {} },
    {
      onSuccess(data) {
        console.log(data.success);
      },
    }
  );

  useEffect(() => {
    console.log(data.data);
  }, [data]);

  return (
    <div>
      <div
        onClick={() =>
          trigger({
            body: { name: '' },
          })
        }
      >
        client
      </div>
      {error && <p>{error}</p>}
    </div>
  );
}
