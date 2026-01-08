declare module "@aws-lite/client" {
  export interface AwsLiteConfig {
    region?: string;
    endpoint?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    plugins?: any[];
  }

  export interface S3Methods {
    PutObject(params: any): Promise<any>;
    GetObject(params: any): Promise<any>;
    DeleteObject(params: any): Promise<any>;
    DeleteObjects(params: any): Promise<any>;
    ListObjectsV2(params: any): Promise<any>;
  }

  export interface AwsLiteClient {
    s3: S3Methods;
    [key: string]: any;
  }

  export default function AwsLite(config: AwsLiteConfig): Promise<AwsLiteClient>;
}

declare module "@aws-lite/s3" {
  const s3Plugin: any;
  export default s3Plugin;
}
