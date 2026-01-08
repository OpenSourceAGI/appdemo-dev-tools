import { AwsLiteClient } from "@aws-lite/client";
import s3 from "@aws-lite/s3";
import { config } from "dotenv";
config();

/**
 * @typedef {'s3' | 'r2' | 'b2'} Provider
 * Cloud storage provider type
 */

/**
 * @typedef {'upload' | 'download' | 'delete' | 'list' | 'deleteAll'} Action
 * Storage operation action type
 */

/**
 * @typedef {Object} StorageOptions
 * @property {string} [key] - The object key/path (required for upload, download, delete)
 * @property {string | Buffer | ReadableStream} [body] - The file content to upload (required for upload)
 * @property {Provider} [provider] - Force a specific cloud provider (auto-detected if omitted)
 * @property {string} [BUCKET_NAME] - Override bucket name at runtime
 * @property {string} [ACCESS_KEY_ID] - Override access key ID at runtime
 * @property {string} [SECRET_ACCESS_KEY] - Override secret access key at runtime
 * @property {string} [BUCKET_URL] - Override bucket URL at runtime
 * @property {string} [awsRegion] - AWS region (only for S3 provider)
 */

/**
 * @typedef {Object} UploadResult
 * @property {boolean} success - Whether the upload was successful
 * @property {string} key - The object key that was uploaded
 */

/**
 * @typedef {Object} DeleteResult
 * @property {boolean} success - Whether the deletion was successful
 * @property {string} key - The object key that was deleted
 */

/**
 * @typedef {Object} DeleteAllResult
 * @property {boolean} success - Whether the operation was successful
 * @property {number} count - Number of objects deleted
 */

/**
 * Universal cloud storage manager supporting AWS S3, Cloudflare R2, and Backblaze B2.
 * Automatically detects the configured provider from environment variables.
 *
 * @param {Action} action - The storage operation to perform
 * @param {StorageOptions} [options={}] - Operation-specific options
 * @returns {Promise<UploadResult | string | DeleteResult | string[] | DeleteAllResult>}
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
export async function manageStorage(action, options = {}) {
  const { key, body, provider: optProvider, ...rest } = options;
  const provider = optProvider || detectDefaultProvider();
  const providerOptions = Object.fromEntries(
    Object.entries(rest).map(([k, v]) => [`${provider.toUpperCase()}_${k}`, v])
  );
  const config = getConfig(provider, providerOptions);
  if (!config.bucket || !config.accessKeyId || !config.secretAccessKey) {
    throw new Error(`Missing credentials for ${provider}`);
  }

  const client = new AwsLiteClient({
    region: config.region,
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    plugins: [s3],
  });

  try {
    switch (action) {
      case "upload":
        const uploadResult = await client.s3.PutObject({
          Bucket: config.bucket,
          Key: key,
          Body: body,
        });
        console.log(`Uploaded ${key} to ${provider}`);
        return { success: true, key, ...uploadResult };
      case "download":
        const downloadResult = await client.s3.GetObject({
          Bucket: config.bucket,
          Key: key,
        });
        console.log(`Downloaded ${key} from ${provider}`);
        return downloadResult.Body;
      case "delete":
        const deleteResult = await client.s3.DeleteObject({
          Bucket: config.bucket,
          Key: key,
        });
        console.log(`Deleted ${key} from ${provider}`);
        return { success: true, key, ...deleteResult };
      case "list":
        const listResult = await client.s3.ListObjectsV2({
          Bucket: config.bucket,
        });
        const keys = listResult.Contents?.map((obj) => obj.Key) || [];
        console.log(keys.join("\n"));
        return keys;
      case "deleteAll":
        const allObjects = await client.s3.ListObjectsV2({
          Bucket: config.bucket,
        });
        if (allObjects.Contents?.length) {
          const deleteAllResult = await client.s3.DeleteObjects({
            Bucket: config.bucket,
            Delete: {
              Objects: allObjects.Contents.map((obj) => ({ Key: obj.Key })),
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
    console.error(`Error in ${provider}:`, error.message);
    throw error;
  }
}

/**
 * Detects which cloud storage provider is configured based on environment variables.
 * Checks for complete sets of credentials for each provider in priority order: R2, B2, S3.
 *
 * @private
 * @returns {Provider} The detected provider ('r2', 'b2', or 's3'). Defaults to 'r2' if none configured.
 *
 * @example
 * // With R2 env vars set
 * const provider = detectDefaultProvider(); // Returns 'r2'
 */
function detectDefaultProvider() {
  const checks = {
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
  for (const [provider, keys] of Object.entries(checks)) {
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
 * @param {Provider} provider - The cloud storage provider to configure
 * @param {Object} [options={}] - Runtime configuration options (with provider prefix)
 * @returns {Object} Configuration object with bucket, credentials, and endpoint
 * @property {string} region - AWS region (or 'auto' for R2/B2)
 * @property {string} endpoint - Storage service endpoint URL
 * @property {string} bucket - Bucket name
 * @property {string} accessKeyId - Access key ID
 * @property {string} secretAccessKey - Secret access key
 *
 * @example
 * const config = getConfig('r2', {
 *   R2_BUCKET_NAME: 'my-bucket',
 *   R2_ACCESS_KEY_ID: 'key123'
 * });
 */
function getConfig(provider, options = {}) {
  const varPrefix = provider.toUpperCase() + "_";
  return {
    region:
      provider === "s3"
        ? options.awsRegion || process.env.S3_REGION || "us-east-1"
        : "auto",
    endpoint:
      options[`${varPrefix}BUCKET_URL`] ||
      process.env[`${varPrefix}BUCKET_URL`],
    bucket:
      options[`${varPrefix}BUCKET_NAME`] ||
      process.env[`${varPrefix}BUCKET_NAME`],
    accessKeyId:
      options[`${varPrefix}ACCESS_KEY_ID`] ||
      options[`${varPrefix}APPLICATION_KEY_ID`] ||
      process.env[`${varPrefix}ACCESS_KEY_ID`] ||
      process.env[`${varPrefix}APPLICATION_KEY_ID`],
    secretAccessKey:
      options[`${varPrefix}SECRET_ACCESS_KEY`] ||
      options[`${varPrefix}APPLICATION_KEY`] ||
      process.env[`${varPrefix}SECRET_ACCESS_KEY`] ||
      process.env[`${varPrefix}APPLICATION_KEY`],
  };
}
