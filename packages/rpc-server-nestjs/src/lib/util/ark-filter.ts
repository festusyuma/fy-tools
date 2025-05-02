import {
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ArkError, ArkErrors } from 'arktype';

@Catch(ArkErrors, ArkError)
export class ArkFilter implements ExceptionFilter {
  catch(e: ArkErrors | ArkError) {
    if (e instanceof ArkErrors) {
      throw new HttpException(
        { error: 'validation error: ' + e.summary },
        HttpStatus.BAD_REQUEST
      );
    }

    throw new HttpException(
      { error: 'validation error: ' + e.message },
      HttpStatus.BAD_REQUEST
    );
  }
}
