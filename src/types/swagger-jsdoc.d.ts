declare module 'swagger-jsdoc' {
  // Minimal types to satisfy our usage in openapi generation
  namespace swaggerJsdoc {
    interface Options {
      definition: any;
      apis: string[];
    }
  }

  function swaggerJsdoc(options: swaggerJsdoc.Options): any;

  export = swaggerJsdoc;
}
