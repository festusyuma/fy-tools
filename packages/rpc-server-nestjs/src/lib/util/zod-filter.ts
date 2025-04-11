import {
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { treeifyError,ZodError } from 'zod';

@Catch(ZodError)
export class ZodFilter implements ExceptionFilter {
  catch(e: ZodError) {
    throw new HttpException(
      {
        error:
          'validation error: ' +
          treeifyError(e).errors.map((e) => e).join('; '),
      },
      HttpStatus.BAD_REQUEST
    );
  }
}
