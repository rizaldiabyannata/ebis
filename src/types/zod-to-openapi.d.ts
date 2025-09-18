declare module '@asteasolutions/zod-to-openapi' {
  export const extendZodWithOpenApi: (z: any) => void;
  export class OpenAPIRegistry {
    constructor();
    register: (name: string, schema: any) => any;
    get definitions(): any[];
  }
  export class OpenApiGeneratorV3 {
    constructor(definitions: any[]);
    generateComponents(): any;
  }
}
