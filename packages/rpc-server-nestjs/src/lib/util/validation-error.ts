import { StandardSchemaV1 } from '@standard-schema/spec';

export class ValidationError extends Error {
  constructor(public issues: ReadonlyArray<StandardSchemaV1.Issue>, options?: ErrorOptions) {
    super("validation error", options);
  }
}