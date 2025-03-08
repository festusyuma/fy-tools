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

    e.Status(400)?.Error((err) => {
      console.error("errors occurred :: ", err.errors.join(', '))
    });

    e.Status(401)?.Error((err) => {
      console.error("unauthorized error :: ", err.error)
    });

    e.Status(0)?.Error(() => {
      console.error("unknown error :: ", e.error.message)
    });
  });
