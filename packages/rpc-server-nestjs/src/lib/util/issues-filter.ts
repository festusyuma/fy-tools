import {
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import { ValidationError } from './validation-error';

@Catch(ValidationError)
export class IssuesFilter implements ExceptionFilter {
  catch(e: ValidationError) {
    console.log("issues :: ", JSON.stringify(e.issues, null, 2))

    throw new HttpException(
      { error: 'validation error: ' + e.message,
        issues: e.issues,
       },
      
      HttpStatus.BAD_REQUEST
    );
  }
}
