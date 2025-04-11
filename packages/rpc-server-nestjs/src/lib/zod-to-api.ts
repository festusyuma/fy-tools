import {
  ZodFirstPartySchemaTypes,
} from 'zod';

export function zodToApi(
  schema: ZodFirstPartySchemaTypes,
  title?: string,
)/*: SchemaObject & { isRequired?: boolean } */{
//   const typeMap: Record<string, string> = {
//     [ZodFirstPartyTypeKind.ZodBoolean]: 'boolean',
//     [ZodFirstPartyTypeKind.ZodString]: 'string',
//     [ZodFirstPartyTypeKind.ZodNumber]: 'number',
//     [ZodFirstPartyTypeKind.ZodObject]: 'object',
//     [ZodFirstPartyTypeKind.ZodArray]: 'array',
//     [ZodFirstPartyTypeKind.ZodEnum]: 'string',
//   };
//
//   const property = zodFieldTpApi(schema);
//
//   const field: SchemaObject & { isRequired?: boolean } = {
//     type: typeMap[property.schema._def.typeName],
//     nullable: property.nullable,
//     description: property.description,
//     title,
//   };
//
//   if (property.schema._def.typeName === ZodFirstPartyTypeKind.ZodArray) {
//     field.items = zodToApi(property.schema._def.type);
//     field.maxLength = property.schema._def.maxLength?.value;
//     field.minLength = property.schema._def.minLength?.value;
//   } else if (property.schema._def.typeName === ZodFirstPartyTypeKind.ZodObject) {
//     const required: string[] = [];
//
//     field.properties = Object.fromEntries(
//       Object.entries(property.schema._def.shape() as ZodRawShape).map(([key, val]) => {
//         const childProperty = zodFieldTpApi(val);
//         if (childProperty.required) required.push(key);
//         return [key, zodToApi(childProperty.schema)];
//       })
//     );
//
//     field.required = required;
//   } else if (
//     property.schema._def.typeName === ZodFirstPartyTypeKind.ZodNativeEnum ||
//     property.schema._def.typeName === ZodFirstPartyTypeKind.ZodEnum
//   ) {
//     field.enum = Object.values(property.schema._def.values);
//   }
//
//   return field;
}
//
// type Property<T extends ZodFirstPartySchemaTypes> = {
//   required?: boolean;
//   nullable?: boolean;
//   description?: string;
//   schema: T;
// };
//
// export function zodFieldTpApi<T extends ZodFirstPartySchemaTypes>(
//   schema: T,
//   prev: Omit<Property<T>, 'schema'> = { required: true, nullable: false }
// ) {
//   if (schema._def.typeName === ZodFirstPartyTypeKind.ZodNullable) {
//     return zodFieldTpApi(schema._def.innerType, { ...prev, nullable: true });
//   } else if (schema._def.typeName === ZodFirstPartyTypeKind.ZodOptional) {
//     return zodFieldTpApi(schema._def.innerType, { ...prev, required: false });
//   } else if (schema._def.typeName === ZodFirstPartyTypeKind.ZodDefault) {
//     return zodFieldTpApi(schema._def.innerType, { ...prev, required: false });
//   } else if (schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects) {
//     return zodFieldTpApi(schema._def.schema, prev);
//   }
//
//   return { ...prev, schema, description: schema.description };
// }
