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
    console.log("issues :: ", JSON.stringify(e.issues, null, 2))

    throw new HttpException(
      { error: 'validation error: ' + e.message,
        issues: e.issues,
       },
      
      HttpStatus.BAD_REQUEST
    );
  }
}
