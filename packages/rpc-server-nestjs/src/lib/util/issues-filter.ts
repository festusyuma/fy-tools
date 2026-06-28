import { ValidationError } from '@fy-tools/rpc-server';
import {
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch(ValidationError)
export class IssuesFilter implements ExceptionFilter {
  catch(e: ValidationError) {
    throw new HttpException(
      { error: 'validation error: ' + e.message, issues: e.issues },

      HttpStatus.BAD_REQUEST
    );
  }
}
