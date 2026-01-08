import AwsLite from "@aws-lite/client";
import s3 from "@aws-lite/s3";
import { config } from "dotenv";
config();

/**
 * Cloud storage provider type
 */
export type Provider = "s3" | "r2" | "b2";

/**
 * Storage operation action type
 */
export type Action = "upload" | "download" | "delete" | "list" | "deleteAll";

/**
 * Options for storage operations
 */
export interface StorageOptions {
  /** The object key/path (required for upload, download, delete) */
  key?: string;
  /** The file content to upload (required for upload) */
  body?: string | Buffer | ReadableStream;
  /** Force a specific cloud provider (auto-detected if omitted) */
  provider?: Provider;
  /** Override bucket name at runtime */
  BUCKET_NAME?: string;
  /** Override access key ID at runtime */
  ACCESS_KEY_ID?: string;
  /** Override secret access key at runtime */
  SECRET_ACCESS_KEY?: string;
  /** Override bucket URL at runtime */
  BUCKET_URL?: string;
  /** AWS region (only for S3 provider) */
  awsRegion?: string;
}

/**
 * Result from upload operation
 */
export interface UploadResult {
  /** Whether the upload was successful */
  success: boolean;
  /** The object key that was uploaded */
  key: string;
  [key: string]: any;
}

/**
 * Result from delete operation
 */
export interface DeleteResult {
  /** Whether the deletion was successful */
  success: boolean;
  /** The object key that was deleted */
  key: string;
  [key: string]: any;
}

/**
 * Result from deleteAll operation
 */
export interface DeleteAllResult {
  /** Whether the operation was successful */
  success: boolean;
  /** Number of objects deleted */
  count: number;
  [key: string]: any;
}

/**
 * Provider configuration object
 */
interface ProviderConfig {
  region: string;
  endpoint: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

/**
 * Universal cloud storage manager supporting AWS S3, Cloudflare R2, and Backblaze B2.
 * Automatically detects the configured provider from environment variables.
 *
 * @param action - The storage operation to perform
 * @param options - Operation-specific options
 * @returns
 *   - upload: Returns {success: true, key: string}
 *   - download: Returns the file content as a string
 *   - delete: Returns {success: true, key: string}
 *   - list: Returns array of object keys
 *   - deleteAll: Returns {success: true, count: number}
 * @throws {Error} When credentials are missing or operation fails
 *
 * @example
 * // Upload a file
 * await manageStorage('upload', {
 *   key: 'documents/report.pdf',
 *   body: fileContent
 * });
 *
 * @example
 * // Download a file
 * const data = await manageStorage('download', {
 *   key: 'documents/report.pdf'
 * });
 *
 * @example
 * // List all files
 * const files = await manageStorage('list');
 *
 * @example
 * // Delete a file
 * await manageStorage('delete', {
 *   key: 'documents/report.pdf'
 * });
 *
 * @example
 * // Force a specific provider with runtime credentials
 * await manageStorage('upload', {
 *   key: 'test.txt',
 *   body: 'Hello!',
 *   provider: 'r2',
 *   BUCKET_NAME: 'my-bucket',
 *   ACCESS_KEY_ID: 'key-id',
 *   SECRET_ACCESS_KEY: 'secret',
 *   BUCKET_URL: 'https://account.r2.cloudflarestorage.com'
 * });
 */
export async function manageStorage(
  action: "upload",
  options: StorageOptions & {
    key: string;
    body: string | Buffer | ReadableStream;
  }
): Promise<UploadResult>;
export async function manageStorage(
  action: "download",
  options: StorageOptions & { key: string }
): Promise<string>;
export async function manageStorage(
  action: "delete",
  options: StorageOptions & { key: string }
): Promise<DeleteResult>;
export async function manageStorage(
  action: "list",
  options?: StorageOptions
): Promise<string[]>;
export async function manageStorage(
  action: "deleteAll",
  options?: StorageOptions
): Promise<DeleteAllResult>;
export async function manageStorage(
  action: Action,
  options: StorageOptions = {}
): Promise<UploadResult | string | DeleteResult | string[] | DeleteAllResult> {
  const { key, body, provider: optProvider, ...rest } = options;
  const provider = optProvider || detectDefaultProvider();
  const providerOptions = Object.fromEntries(
    Object.entries(rest).map(([k, v]) => [`${provider.toUpperCase()}_${k}`, v])
  );
  const config = getConfig(provider, providerOptions);
  if (!config.bucket || !config.accessKeyId || !config.secretAccessKey) {
    throw new Error(`Missing credentials for ${provider}`);
  }

  const client = await AwsLite({
    region: config.region,
    endpoint: config.endpoint,
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    plugins: [s3],
  });

  try {
    switch (action) {
      case "upload":
        const uploadResult = await client.s3.PutObject({
          Bucket: config.bucket,
          Key: key!,
          Body: body,
        });
        console.log(`Uploaded ${key} to ${provider}`);
        return { success: true, key: key!, ...uploadResult };
      case "download":
        const downloadResult = await client.s3.GetObject({
          Bucket: config.bucket,
          Key: key!,
        });
        console.log(`Downloaded ${key} from ${provider}`);
        return downloadResult.Body as string;
      case "delete":
        const deleteResult = await client.s3.DeleteObject({
          Bucket: config.bucket,
          Key: key!,
        });
        console.log(`Deleted ${key} from ${provider}`);
        return { success: true, key: key!, ...deleteResult };
      case "list":
        const listResult = await client.s3.ListObjectsV2({
          Bucket: config.bucket,
        });
        const keys = listResult.Contents?.map((obj: any) => obj.Key) || [];
        console.log(keys.join("\n"));
        return keys as string[];
      case "deleteAll":
        const allObjects = await client.s3.ListObjectsV2({
          Bucket: config.bucket,
        });
        if (allObjects.Contents?.length) {
          const deleteAllResult = await client.s3.DeleteObjects({
            Bucket: config.bucket,
            Delete: {
              Objects: allObjects.Contents.map((obj: any) => ({ Key: obj.Key })),
            },
          });
          console.log(
            `Deleted all ${allObjects.Contents.length} files from ${provider}`
          );
          return {
            success: true,
            count: allObjects.Contents.length,
            ...deleteAllResult,
          };
        } else {
          console.log(`${provider} bucket empty`);
          return { success: true, count: 0 };
        }
      default:
        throw new Error(
          "Invalid action: upload, download, delete, list, deleteAll"
        );
    }
  } catch (error) {
    console.error(`Error in ${provider}:`, (error as Error).message);
    throw error;
  }
}

/**
 * Detects which cloud storage provider is configured based on environment variables.
 * Checks for complete sets of credentials for each provider in priority order: R2, B2, S3.
 *
 * @private
 * @returns The detected provider ('r2', 'b2', or 's3'). Defaults to 'r2' if none configured.
 *
 * @example
 * // With R2 env vars set
 * const provider = detectDefaultProvider(); // Returns 'r2'
 */
function detectDefaultProvider(): Provider {
  const checks: Record<Provider, string[]> = {
    r2: [
      "R2_BUCKET_NAME",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_BUCKET_URL",
    ],
    b2: [
      "B2_BUCKET_NAME",
      "B2_ACCESS_KEY_ID",
      "B2_SECRET_ACCESS_KEY",
      "B2_BUCKET_URL",
    ],
    s3: [
      "S3_BUCKET_NAME",
      "S3_ACCESS_KEY_ID",
      "S3_SECRET_ACCESS_KEY",
      "S3_BUCKET_URL",
    ],
  };
  for (const [provider, keys] of Object.entries(checks) as [
    Provider,
    string[]
  ][]) {
    if (keys.every((key) => process.env[key])) {
      return provider;
    }
  }
  return "r2"; // Default
}

/**
 * Builds the configuration object for the cloud storage client by merging
 * environment variables with runtime options.
 *
 * @private
 * @param provider - The cloud storage provider to configure
 * @param options - Runtime configuration options (with provider prefix)
 * @returns Configuration object with bucket, credentials, and endpoint
 *
 * @example
 * const config = getConfig('r2', {
 *   R2_BUCKET_NAME: 'my-bucket',
 *   R2_ACCESS_KEY_ID: 'key123'
 * });
 */
function getConfig(
  provider: Provider,
  options: Record<string, any> = {}
): ProviderConfig {
  const varPrefix = provider.toUpperCase() + "_";
  return {
    region:
      provider === "s3"
        ? options.awsRegion || process.env.S3_REGION || "us-east-1"
        : "auto",
    endpoint:
      options[`${varPrefix}BUCKET_URL`] ||
      process.env[`${varPrefix}BUCKET_URL`] ||
      "",
    bucket:
      options[`${varPrefix}BUCKET_NAME`] ||
      process.env[`${varPrefix}BUCKET_NAME`] ||
      "",
    accessKeyId:
      options[`${varPrefix}ACCESS_KEY_ID`] ||
      options[`${varPrefix}APPLICATION_KEY_ID`] ||
      process.env[`${varPrefix}ACCESS_KEY_ID`] ||
      process.env[`${varPrefix}APPLICATION_KEY_ID`] ||
      "",
    secretAccessKey:
      options[`${varPrefix}SECRET_ACCESS_KEY`] ||
      options[`${varPrefix}APPLICATION_KEY`] ||
      process.env[`${varPrefix}SECRET_ACCESS_KEY`] ||
      process.env[`${varPrefix}APPLICATION_KEY`] ||
      "",
  };
}
