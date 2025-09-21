declare module 'swagger-ui-react' {
  import { ComponentType, CSSProperties } from 'react';

  export interface SwaggerUIProps {
    url?: string;
    spec?: object;
    docExpansion?: 'list' | 'full' | 'none';
    defaultModelsExpandDepth?: number;
    defaultModelExpandDepth?: number;
    defaultModelRendering?: 'example' | 'model';
    displayOperationId?: boolean;
    tryItOutEnabled?: boolean;
    filter?: boolean | string;
    onComplete?: () => void;
    presets?: any[];
    plugins?: any[];
    layout?: string;
    validatorUrl?: string | null;
    withCredentials?: boolean;
    requestInterceptor?: (req: any) => any;
    responseInterceptor?: (res: any) => any;
    supportedSubmitMethods?: string[];
    deepLinking?: boolean;
    showExtensions?: boolean;
    showCommonExtensions?: boolean;
    syntaxHighlight?: {
      activate?: boolean;
      theme?: string;
    } | false;
    docExpansion?: 'list' | 'full' | 'none';
    style?: CSSProperties;
    className?: string;
    [key: string]: any;
  }

  const SwaggerUI: ComponentType<SwaggerUIProps>;
  export default SwaggerUI;
}
