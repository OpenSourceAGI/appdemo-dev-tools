<p align="center">
    <img width="350px" src="https://i.imgur.com/qEdTwly.png" />
</p>

# Cloud Storage Manager

Universal cloud storage manager supporting AWS S3, Cloudflare R2, and Backblaze B2 with automatic provider detection. Built on the lightweight [@aws-lite](https://aws-lite.org/) SDK for optimal performance in serverless environments.

## Features

- **Multi-Cloud Support**: Works seamlessly with AWS S3, Cloudflare R2, and Backblaze B2
- **Auto-Detection**: Automatically detects the configured provider from environment variables
- **Lightweight**: Built on aws-lite (not the bloated AWS SDK) for faster cold starts
- **Simple API**: Single function interface for all storage operations
- **No File System**: Returns data directly - perfect for serverless/edge environments
- **TypeScript Ready**: Full type support (coming soon)

## Installation

```bash
npm install manage-storage
```

```bash
bun i manage-storage
```

## Quick Start

```javascript
import { manageStorage } from "manage-storage";

// Upload a file
await manageStorage("upload", {
  key: "documents/report.pdf",
  body: fileContent,
});

// Download a file
const data = await manageStorage("download", {
  key: "documents/report.pdf",
});

// List all files
const files = await manageStorage("list");

// Delete a file
await manageStorage("delete", {
  key: "documents/report.pdf",
});
```

## Configuration

Set environment variables for your preferred provider. The library will automatically detect which provider to use.

### Cloudflare R2

```env
R2_BUCKET_NAME=my-bucket
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_URL=https://your-account-id.r2.cloudflarestorage.com
```

### Backblaze B2

```env
B2_BUCKET_NAME=my-bucket
B2_ACCESS_KEY_ID=your-key-id
B2_SECRET_ACCESS_KEY=your-application-key
B2_BUCKET_URL=https://s3.us-west-004.backblazeb2.com
```

### AWS S3

```env
S3_BUCKET_NAME=my-bucket
S3_ACCESS_KEY_ID=your-access-key-id
S3_SECRET_ACCESS_KEY=your-secret-access-key
S3_BUCKET_URL=https://s3.amazonaws.com
S3_REGION=us-east-1
```

## API Reference

### `manageStorage(action, options)`

Performs storage operations on your configured cloud provider.

#### Parameters

- **action** `string` - The operation to perform: `'upload'`, `'download'`, `'delete'`, `'list'`, or `'deleteAll'`
- **options** `object` - Operation-specific options

#### Options

| Option     | Type                     | Required                            | Description                                          |
| ---------- | ------------------------ | ----------------------------------- | ---------------------------------------------------- |
| `key`      | `string`                 | Yes (except for `list`/`deleteAll`) | The object key/path                                  |
| `body`     | `string\|Buffer\|Stream` | Yes (for `upload`)                  | The file content to upload                           |
| `provider` | `'s3'\|'r2'\|'b2'`       | No                                  | Force a specific provider (auto-detected if omitted) |

## Usage Examples

### 1. Upload Files

```javascript
// Upload text content
await manageStorage("upload", {
  key: "notes/memo.txt",
  body: "Hello, World!",
});

// Upload Buffer
const buffer = Buffer.from("File contents");
await manageStorage("upload", {
  key: "data/file.bin",
  body: buffer,
});

// Upload JSON
await manageStorage("upload", {
  key: "config/settings.json",
  body: JSON.stringify({ theme: "dark", lang: "en" }),
});
```

### 2. Download Files

```javascript
// Download and get the raw data
const data = await manageStorage("download", {
  key: "notes/memo.txt",
});
console.log(data); // "Hello, World!"

// Download JSON and parse
const configData = await manageStorage("download", {
  key: "config/settings.json",
});
const config = JSON.parse(configData);
console.log(config.theme); // "dark"
```

### 3. List Files

```javascript
// List all files in the bucket
const files = await manageStorage("list");
console.log(files);
// Output: ['notes/memo.txt', 'data/file.bin', 'config/settings.json']

// Filter by prefix (folder)
const notes = files.filter((key) => key.startsWith("notes/"));
console.log(notes); // ['notes/memo.txt']
```

### 4. Delete Files

```javascript
// Delete a single file
await manageStorage("delete", {
  key: "notes/memo.txt",
});

// Delete all files in the bucket (use with caution!)
const result = await manageStorage("deleteAll");
console.log(`Deleted ${result.count} files`);
```

### 5. Force a Specific Provider

```javascript
// Use R2 even if other providers are configured
await manageStorage("upload", {
  key: "test.txt",
  body: "Hello R2!",
  provider: "r2",
});

// Use B2 specifically
await manageStorage("upload", {
  key: "test.txt",
  body: "Hello B2!",
  provider: "b2",
});
```

### 6. Runtime Configuration (Override Environment Variables)

```javascript
// Pass credentials at runtime instead of using env vars
await manageStorage("upload", {
  key: "secure/data.json",
  body: JSON.stringify({ secret: "value" }),
  provider: "r2",
  BUCKET_NAME: "my-custom-bucket",
  ACCESS_KEY_ID: "runtime-key-id",
  SECRET_ACCESS_KEY: "runtime-secret",
  BUCKET_URL: "https://custom-account.r2.cloudflarestorage.com",
});
```

## Advanced Examples

### Next.js API Route

```javascript
// app/api/upload/route.js
import { manageStorage } from "manage-storage";

export async function POST(req) {
  const { fileName, fileContent } = await req.json();

  const result = await manageStorage("upload", {
    key: `uploads/${fileName}`,
    body: fileContent,
  });

  return Response.json(result);
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const fileName = searchParams.get("file");

  const data = await manageStorage("download", {
    key: `uploads/${fileName}`,
  });

  return new Response(data, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
```

### Express.js Endpoint

```javascript
import express from "express";
import { manageStorage } from "@opensourceagi/cloud-storage";

const app = express();
app.use(express.json());

app.post("/api/files", async (req, res) => {
  try {
    const { key, content } = req.body;
    const result = await manageStorage("upload", { key, body: content });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/files", async (req, res) => {
  try {
    const files = await manageStorage("list");
    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/files/:key", async (req, res) => {
  try {
    const data = await manageStorage("download", { key: req.params.key });
    res.send(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/files/:key", async (req, res) => {
  try {
    const result = await manageStorage("delete", { key: req.params.key });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
```

### Cloudflare Workers

```javascript
import { manageStorage } from "@opensourceagi/cloud-storage";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/upload") {
      const { key, content } = await request.json();

      const result = await manageStorage("upload", {
        key,
        body: content,
        provider: "r2",
        BUCKET_NAME: env.R2_BUCKET_NAME,
        ACCESS_KEY_ID: env.R2_ACCESS_KEY_ID,
        SECRET_ACCESS_KEY: env.R2_SECRET_ACCESS_KEY,
        BUCKET_URL: env.R2_BUCKET_URL,
      });

      return Response.json(result);
    }

    return new Response("Not found", { status: 404 });
  },
};
```

### Batch Operations

```javascript
// Upload multiple files
const files = [
  { key: "docs/file1.txt", content: "Content 1" },
  { key: "docs/file2.txt", content: "Content 2" },
  { key: "docs/file3.txt", content: "Content 3" },
];

await Promise.all(
  files.map((file) =>
    manageStorage("upload", { key: file.key, body: file.content })
  )
);

// Download multiple files
const keys = ["docs/file1.txt", "docs/file2.txt", "docs/file3.txt"];
const contents = await Promise.all(
  keys.map((key) => manageStorage("download", { key }))
);
```

## Return Values

### Upload

```javascript
{
  success: true,
  key: 'path/to/file.txt',
  // ... additional provider-specific metadata
}
```

### Download

```javascript
// Returns the file content as a string
"File contents here...";
```

### Delete

```javascript
{
  success: true,
  key: 'path/to/file.txt'
}
```

### List

```javascript
["folder/file1.txt", "folder/file2.txt", "another/file3.json"];
```

### DeleteAll

```javascript
{
  success: true,
  count: 42
}
```

## Why aws-lite?

This library uses [@aws-lite](https://aws-lite.org/) instead of the official AWS SDK because:

- **10-100x smaller**: Significantly reduced bundle size
- **Faster cold starts**: Critical for serverless/edge functions
- **S3-compatible**: Works with S3, R2, B2, and any S3-compatible service
- **Modern API**: Clean, promise-based interface
- **No dependencies overhead**: Minimal dependency tree

# Cloud Object Storage Comparison: GCS, Backblaze B2, Cloudflare R2, and AWS S3

Google Cloud Storage (GCS) joins Backblaze B2, Cloudflare R2, and AWS S3 as a hyperscaler option with [strong multi-region support](https://cloud.google.com/storage/pricing), multiple storage classes, and [deep integration with Google Cloud services](https://cloud.google.com/storage/pricing). These providers all [offer S3-compatible object storage](https://www.backblaze.com/cloud-storage/pricing) but differ significantly in [pricing models](https://www.backblaze.com/cloud-storage/pricing), especially storage costs, egress fees, and ecosystem fit.

## Updated pricing snapshot ("hot"/Standard storage)

| Service                                                         | Storage price (/TB-month)      | Egress to internet                                                                        | API ops (Class A/B per 1K, approx)                                                 | Minimum duration                                            | Notes                                                              |
| --------------------------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------ |
| [Backblaze B2](https://www.backblaze.com/cloud-storage/pricing) | **$6**                         | [Free up to 3x stored/mo](https://www.backblaze.com/cloud-storage/pricing), then $0.01/GB | [Free quotas](https://www.backblaze.com/cloud-storage/pricing); then ~$0.004/10K B | [None](https://www.backblaze.com/cloud-storage/pricing)     | Lowest storage; generous egress.                                   |
| [Cloudflare R2](https://developers.cloudflare.com/r2/pricing/)  | **$15**                        | [**Zero**](https://www.cloudflare.com/pg-cloudflare-r2-vs-aws-s3/)                        | [~$4.50/M A; $0.36/M B](https://developers.cloudflare.com/r2/pricing/)             | None                                                        | No bandwidth bills.                                                |
| [AWS S3 Standard](https://aws.amazon.com/s3/pricing/)           | **$23**                        | [Tiered ~$0.09/GB first 10TB](https://www.nops.io/blog/aws-s3-pricing/)                   | [~$5/M A; $0.4/M B](https://aws.amazon.com/s3/pricing/)                            | None                                                        | Ecosystem premium.                                                 |
| [Google GCS Standard](https://cloud.google.com/storage/pricing) | **$20-26** (region/dual/multi) | [Tiered ~$0.08-0.12/GB worldwide](https://cloud.google.com/storage/pricing)               | [$5/1K A; $0.4/1K B (Standard)](https://cloud.google.com/storage/pricing)          | [None (Standard)](https://cloud.google.com/storage/pricing) | Multi-region ~$26; cheaper classes available (Nearline $10, etc.). |

## Feature comparison

| Aspect               | Backblaze B2                                                                            | Cloudflare R2                                                                                   | AWS S3                                                                | Google GCS                                                                        |
| -------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Ecosystem**        | [Standalone; partners (Fastly, Vultr)](https://www.backblaze.com/cloud-storage/pricing) | [Cloudflare Workers/CDN/Zero Trust](https://www.cloudflare.com/developer-platform/products/r2/) | [Full AWS (Lambda, EC2, Athena)](https://aws.amazon.com/s3/pricing/)  | [Full GCP (GKE, BigQuery, AI/ML)](https://cloud.google.com/storage/pricing)       |
| **Storage classes**  | [Single hot](https://www.backblaze.com/cloud-storage/pricing)                           | [Single](https://developers.cloudflare.com/r2/pricing/)                                         | [Many (IA, Glacier, Intelligent)](https://aws.amazon.com/s3/pricing/) | [Standard, Nearline, Coldline, Archive](https://cloud.google.com/storage/pricing) |
| **S3 compatibility** | [Strong](https://onidel.com/blog/cloudflare-r2-vs-backblaze-b2)                         | [Excellent (99% ops)](https://onidel.com/blog/cloudflare-r2-vs-backblaze-b2)                    | [Native](https://aws.amazon.com/s3/pricing/)                          | [Strong](https://cloud.google.com/storage/pricing)                                |
| **Lifecycle mgmt**   | [Basic rules](https://onidel.com/blog/cloudflare-r2-vs-backblaze-b2)                    | [Basic expiration](https://onidel.com/blog/cloudflare-r2-vs-backblaze-b2)                       | [Advanced](https://aws.amazon.com/s3/pricing/)                        | [Advanced, Autoclass](https://cloud.google.com/storage/pricing)                   |
| **Object Lock**      | [Yes (compliance/gov)](https://onidel.com/blog/cloudflare-r2-vs-backblaze-b2)           | [Limited](https://onidel.com/blog/cloudflare-r2-vs-backblaze-b2)                                | [Yes](https://onidel.com/blog/cloudflare-r2-vs-backblaze-b2)          | [Yes (via retention)](https://cloud.google.com/storage/pricing)                   |
| **Free tier**        | [First 10GB](https://www.backblaze.com/cloud-storage/pricing)                           | [10GB storage, 1M Class A/mo](https://developers.cloudflare.com/r2/pricing/)                    | [Limited](https://aws.amazon.com/s3/pricing/)                         | 5GB-months Standard                                                               |

## Core use-case fit

- **[Backblaze B2](https://www.backblaze.com/cloud-storage)**: [Cheapest for bulk/hot storage](https://onidel.com/blog/cloudflare-r2-vs-backblaze-b2) with moderate egress (backups, media archives); simple, [no vendor lock-in](https://www.backblaze.com/cloud-storage).
- **[Cloudflare R2](https://developers.cloudflare.com/r2/pricing/)**: [Public-facing assets/images/APIs](https://www.cloudflare.com/pg-cloudflare-r2-vs-aws-s3/) with high traffic; [zero egress](https://www.cloudflare.com/developer-platform/products/r2/) saves big on [web delivery](https://onidel.com/blog/cloudflare-r2-vs-backblaze-b2).
- **[AWS S3](https://aws.amazon.com/s3/pricing/)**: [AWS-centric apps](https://www.nops.io/blog/aws-s3-pricing/) needing [advanced analytics, replication, compliance](https://cloudian.com/blog/5-components-of-aws-s3-storage-pricing/); [pay for features/ecosystem](https://onidel.com/blog/cloudflare-r2-vs-backblaze-b2).
- **[Google GCS](https://cloud.google.com/storage/pricing)**: [GCP workloads](https://cloud.google.com/storage/pricing) (BigQuery, AI, Kubernetes); [multi-region needs](https://onidel.com/blog/cloudflare-r2-vs-backblaze-b2) or tiered classes for cost optimization.

Backblaze wins on raw storage cost, R2 on bandwidth-heavy apps, while AWS/GCS suit enterprise ecosystems with richer tools. For exact costs, use [calculators](https://r2-calculator.cloudflare.com) with your workload (e.g., [TB stored](https://www.backblaze.com/cloud-storage/pricing), [TB egress](https://onidel.com/blog/cloudflare-r2-vs-backblaze-b2), [ops volume](https://aws.amazon.com/s3/pricing/)).
