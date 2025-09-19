import * as OpenAPI from 'fumadocs-openapi';
import { rimraf } from 'rimraf';
import { existsSync } from 'fs';
import { resolve } from 'path';

const out = 'content/docs/(api)';

function showHelp() {
  console.log(`
Usage: node generate-api-docs.mjs <openapi-file-path>

Arguments:
  openapi-file-path    Path to the OpenAPI YAML file

Examples:
  node generate-api-docs.mjs ./api/openapi.yml
  node generate-api-docs.mjs ../shared/schema.yaml

Options:
  -h, --help          Show this help message
`);
}

async function generate(openapiPath) {
  // Validate file exists
  if (!existsSync(openapiPath)) {
    console.error(`Error: OpenAPI file not found at "${openapiPath}"`);
    process.exit(1);
  }

  // Use relative path for glob resolution
  console.log(`Generating API docs from: ${openapiPath}`);

  // clean generated files
  await rimraf(out, {
    filter(v) {
      return !v.endsWith('index.mdx') && !v.endsWith('meta.json');
    },
  });

  await OpenAPI.generateFiles({
    // input files - use relative path for glob resolution
    input: [openapiPath],
    output: out,
    includeDescription: false,
  });

  console.log(`API documentation generated successfully in: ${out}`);
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
  showHelp();
  process.exit(0);
}

const openapiPath = args[0];

void generate(openapiPath);
