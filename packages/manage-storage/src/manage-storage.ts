import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
import { config } from "dotenv";
config();

/**
 * Cloud storage provider type
 */
export type Provider = "amazon" | "backblaze" | "cloudflare";

/**
 * Storage operation action type
 */
export type Action =
  | "upload"
  | "download"
  | "delete"
  | "list"
  | "deleteAll"
  | "copy"
  | "rename";

/**
 * Options for storage operations
 */
export interface StorageOptions {
  /** The object key/path (required for upload, download, delete) */
  key?: string;
  /** The destination key/path (required for copy, rename) */
  destinationKey?: string;
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
 * Result from copy operation
 */
export interface CopyResult {
  /** Whether the copy was successful */
  success: boolean;
  /** The source object key */
  sourceKey: string;
  /** The destination object key */
  destinationKey: string;
  [key: string]: any;
}

/**
 * Result from rename operation
 */
export interface RenameResult {
  /** Whether the rename was successful */
  success: boolean;
  /** The old object key */
  oldKey: string;
  /** The new object key */
  newKey: string;
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
 * Universal cloud storage manager supporting Amazon S3, Backblaze B2, and Cloudflare R2.
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
 * // Copy a file
 * await manageStorage('copy', {
 *   key: 'documents/report.pdf',
 *   destinationKey: 'documents/report-copy.pdf'
 * });
 *
 * @example
 * // Rename a file (copy + delete)
 * await manageStorage('rename', {
 *   key: 'documents/old-name.pdf',
 *   destinationKey: 'documents/new-name.pdf'
 * });
 *
 * @example
 * // Force a specific provider with runtime credentials
 * await manageStorage('upload', {
 *   key: 'test.txt',
 *   body: 'Hello!',
 *   provider: 'cloudflare',
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
  action: "copy",
  options: StorageOptions & { key: string; destinationKey: string }
): Promise<CopyResult>;
export async function manageStorage(
  action: "rename",
  options: StorageOptions & { key: string; destinationKey: string }
): Promise<RenameResult>;
export async function manageStorage(
  action: Action,
  options: StorageOptions = {}
): Promise<
  | UploadResult
  | string
  | DeleteResult
  | string[]
  | DeleteAllResult
  | CopyResult
  | RenameResult
> {
  const { key, body, destinationKey, provider: optProvider, ...rest } = options;
  const provider = optProvider || detectDefaultProvider();
  const providerOptions = Object.fromEntries(
    Object.entries(rest).map(([k, v]) => [`${provider.toUpperCase()}_${k}`, v])
  );
  const config = getConfig(provider, providerOptions);
  if (!config.bucket || !config.accessKeyId || !config.secretAccessKey) {
    throw new Error(`Missing credentials for ${provider}`);
  }

  const client = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  try {
    switch (action) {
      case "upload":
        const uploadResult = await client.send(
          new PutObjectCommand({
            Bucket: config.bucket,
            Key: key!,
            Body: body,
          })
        );
        return { success: true, key: key!, ...uploadResult };
      case "download":
        const downloadResult = await client.send(
          new GetObjectCommand({
            Bucket: config.bucket,
            Key: key!,
          })
        );
        const bodyString = await downloadResult.Body?.transformToString();
        return bodyString as string;
      case "delete":
        const deleteResult = await client.send(
          new DeleteObjectCommand({
            Bucket: config.bucket,
            Key: key!,
          })
        );
        return { success: true, key: key!, ...deleteResult };
      case "list":
        const listResult = await client.send(
          new ListObjectsV2Command({
            Bucket: config.bucket,
          })
        );
        const keys = listResult.Contents?.map((obj: any) => obj.Key) || [];
        return keys as string[];
      case "deleteAll":
        const allObjects = await client.send(
          new ListObjectsV2Command({
            Bucket: config.bucket,
          })
        );
        if (allObjects.Contents?.length) {
          const deleteAllResult = await client.send(
            new DeleteObjectsCommand({
              Bucket: config.bucket,
              Delete: {
                Objects: allObjects.Contents.map((obj: any) => ({
                  Key: obj.Key,
                })),
              },
            })
          );
          return {
            success: true,
            count: allObjects.Contents.length,
            ...deleteAllResult,
          };
        } else {
          return { success: true, count: 0 };
        }
      case "copy":
        if (!destinationKey) {
          throw new Error("destinationKey is required for copy operation");
        }
        const copyResult = await client.send(
          new CopyObjectCommand({
            Bucket: config.bucket,
            CopySource: `${config.bucket}/${key!}`,
            Key: destinationKey,
          })
        );
        return {
          success: true,
          sourceKey: key!,
          destinationKey,
          ...copyResult,
        };
      case "rename":
        if (!destinationKey) {
          throw new Error("destinationKey is required for rename operation");
        }
        await client.send(
          new CopyObjectCommand({
            Bucket: config.bucket,
            CopySource: `${config.bucket}/${key!}`,
            Key: destinationKey,
          })
        );
        await client.send(
          new DeleteObjectCommand({
            Bucket: config.bucket,
            Key: key!,
          })
        );
        return {
          success: true,
          oldKey: key!,
          newKey: destinationKey,
        };
      default:
        throw new Error(
          "Invalid action: upload, download, delete, list, deleteAll, copy, rename"
        );
    }
  } catch (error) {
    console.error(`Error in ${provider}:`, (error as Error).message);
    throw error;
  }
}

/**
 * Detects which cloud storage provider is configured based on environment variables.
 * Checks for complete sets of credentials for each provider in priority order: Cloudflare, Backblaze, Amazon.
 *
 * @private
 * @returns The detected provider ('cloudflare', 'backblaze', or 'amazon'). Defaults to 'cloudflare' if none configured.
 *
 * @example
 * // With Cloudflare env vars set
 * const provider = detectDefaultProvider(); // Returns 'cloudflare'
 */
function detectDefaultProvider(): Provider {
  const checks: Record<Provider, string[]> = {
    cloudflare: [
      "CLOUDFLARE_BUCKET_NAME",
      "CLOUDFLARE_ACCESS_KEY_ID",
      "CLOUDFLARE_SECRET_ACCESS_KEY",
      "CLOUDFLARE_BUCKET_URL",
    ],
    backblaze: [
      "BACKBLAZE_BUCKET_NAME",
      "BACKBLAZE_ACCESS_KEY_ID",
      "BACKBLAZE_SECRET_ACCESS_KEY",
      "BACKBLAZE_BUCKET_URL",
    ],
    amazon: [
      "AMAZON_BUCKET_NAME",
      "AMAZON_ACCESS_KEY_ID",
      "AMAZON_SECRET_ACCESS_KEY",
      "AMAZON_BUCKET_URL",
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
  return "cloudflare"; // Default
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
 * const config = getConfig('cloudflare', {
 *   CLOUDFLARE_BUCKET_NAME: 'my-bucket',
 *   CLOUDFLARE_ACCESS_KEY_ID: 'key123'
 * });
 */
function getConfig(
  provider: Provider,
  options: Record<string, any> = {}
): ProviderConfig {
  const varPrefix = provider.toUpperCase() + "_";
  return {
    region:
      provider === "amazon"
        ? options.awsRegion || process.env.AMAZON_REGION || "us-east-1"
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


export default manageStorage;