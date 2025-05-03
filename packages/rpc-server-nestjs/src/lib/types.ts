import type { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

// type IsArray<T> = T extends any[] ? T : never;

// export type FromBaseRoute<T> = T extends _Route
//   ? T extends _Route<
//       infer TPath,
//       infer TMethod,
//       infer TResponse,
//       infer TBody,
//       infer TParams,
//       infer TQuery,
//       infer TAuth
//     >
//     ? Route<TPath, TMethod, TResponse, TBody, TParams, TQuery, TAuth>
//     : never
//   : never;
//
// export type FromBaseController<T> = T extends _Controller<any, any>
//   ? T extends _Controller<infer TP, infer TR>
//     ? Controller<TP, { [K in keyof TR]: FromBaseRoute<TR[K]> }>
//     : never
//   : never;
//
// export type FromBaseApp<T> = T extends _App<any, any>
//   ? T extends _App<infer TC extends _Controller<any, any>[], infer TE>
//     ? App<IsArray<{ [K in keyof TC]: FromBaseController<TC[K]> }>, TE>
//     : never
//   : never;

export type AppConfig = {
  toJsonSchema: (schema: any) => SchemaObject
}