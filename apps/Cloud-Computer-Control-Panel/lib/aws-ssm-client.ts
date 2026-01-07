import crypto from "crypto"

function hmac(key: string | Buffer, data: string): Buffer {
  return crypto.createHmac("sha256", key as any).update(data, "utf8").digest()
}

function sha256Hex(data: string): string {
  return crypto.createHash("sha256").update(data, "utf8").digest("hex")
}

function getSignatureKey(secretKey: string, dateStamp: string, region: string, service: string): Buffer {
  const kDate = hmac("AWS4" + secretKey, dateStamp)
  const kRegion = hmac(kDate, region)
  const kService = hmac(kRegion, service)
  const kSigning = hmac(kService, "aws4_request")
  return kSigning
}

async function ssmRequest(
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
  target: string,
  payload: any,
): Promise<any> {
  const host = `ssm.${region}.amazonaws.com`
  const endpoint = `https://${host}/`
  const method = "POST"
  const service = "ssm"

  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "")
  const dateStamp = amzDate.slice(0, 8)

  const body = JSON.stringify(payload)

  const canonicalUri = "/"
  const canonicalQueryString = ""
  const canonicalHeaders = [
    ["content-type", "application/x-amz-json-1.1"],
    ["host", host],
    ["x-amz-date", amzDate],
    ["x-amz-target", target],
  ]
    .map(([k, v]) => `${k}:${v}\n`)
    .join("")

  const signedHeaders = "content-type;host;x-amz-date;x-amz-target"
  const payloadHash = sha256Hex(body)

  const canonicalRequest = [method, canonicalUri, canonicalQueryString, canonicalHeaders, signedHeaders, payloadHash].join(
    "\n",
  )

  const algorithm = "AWS4-HMAC-SHA256"
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
  const stringToSign = [algorithm, amzDate, credentialScope, sha256Hex(canonicalRequest)].join("\n")

  const signingKey = getSignatureKey(secretAccessKey, dateStamp, region, service)
  const signature = crypto.createHmac("sha256", signingKey as any).update(stringToSign, "utf8").digest("hex")

  const authorizationHeader = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  const headers = {
    "Content-Type": "application/x-amz-json-1.1",
    "X-Amz-Date": amzDate,
    "X-Amz-Target": target,
    Authorization: authorizationHeader,
  }

  const res = await fetch(endpoint, {
    method,
    headers,
    body,
  })

  const text = await res.text()
  if (!res.ok) {
    throw new Error(`SSM error ${res.status}: ${text}`)
  }

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

/**
 * Send a command to run on EC2 instances via SSM
 */
export async function sendCommand(
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
  instanceIds: string[],
  commands: string[],
  documentName: string = "AWS-RunShellScript",
): Promise<{ commandId: string }> {
  const payload = {
    InstanceIds: instanceIds,
    DocumentName: documentName,
    Parameters: {
      commands: commands,
    },
    TimeoutSeconds: 3600, // 1 hour timeout
  }

  const result = await ssmRequest(accessKeyId, secretAccessKey, region, "AmazonSSM.SendCommand", payload)

  return {
    commandId: result.Command?.CommandId || "",
  }
}

/**
 * Get the status and output of a command invocation
 */
export async function getCommandInvocation(
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
  commandId: string,
  instanceId: string,
): Promise<{
  status: string
  statusDetails: string
  standardOutput: string
  standardError: string
}> {
  const payload = {
    CommandId: commandId,
    InstanceId: instanceId,
  }

  const result = await ssmRequest(accessKeyId, secretAccessKey, region, "AmazonSSM.GetCommandInvocation", payload)

  return {
    status: result.Status || "Unknown",
    statusDetails: result.StatusDetails || "",
    standardOutput: result.StandardOutputContent || "",
    standardError: result.StandardErrorContent || "",
  }
}

/**
 * List command invocations for a specific command
 */
export async function listCommandInvocations(
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
  commandId: string,
): Promise<
  Array<{
    instanceId: string
    status: string
    statusDetails: string
  }>
> {
  const payload = {
    CommandId: commandId,
    Details: false,
  }

  const result = await ssmRequest(accessKeyId, secretAccessKey, region, "AmazonSSM.ListCommandInvocations", payload)

  return (
    result.CommandInvocations?.map((inv: any) => ({
      instanceId: inv.InstanceId,
      status: inv.Status,
      statusDetails: inv.StatusDetails || "",
    })) || []
  )
}

export function createSSMClient(accessKeyId: string, secretAccessKey: string, region: string) {
  return {
    sendCommand: (instanceIds: string[], commands: string[], documentName?: string) =>
      sendCommand(accessKeyId, secretAccessKey, region, instanceIds, commands, documentName),
    getCommandInvocation: (commandId: string, instanceId: string) =>
      getCommandInvocation(accessKeyId, secretAccessKey, region, commandId, instanceId),
    listCommandInvocations: (commandId: string) =>
      listCommandInvocations(accessKeyId, secretAccessKey, region, commandId),
  }
}
