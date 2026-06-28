import { addUser, type AddUserPayload, AppError } from './client';

const data: AddUserPayload = {
  body: { name: 'Festus' },
};

addUser(
  /** Type safe payload */
  data,
  {
    /** Use axios request options here */
    headers: {},
  }
)
  .then((res) => {
    /** Type safe response */
    console.log('res :: ', res.data);
  })
  .catch((e: AppError) => {
    /** Error types are inferred based on status */

    switch (e.status) {
      case 400:
        console.error('errors occurred :: ', e.response.data.errors.join(', '));
        break;
      case 401:
        console.error('errors occurred :: ', e.response.data.error);
        break;
      default:
        console.error('unknown error :: ', e.response.data);
    }
  });
