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

async function ec2Query(
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
  action: string,
  params: Record<string, string> = {},
): Promise<string> {
  const host = `ec2.${region}.amazonaws.com`
  const endpoint = `https://${host}/`
  const method = "POST"
  const service = "ec2"

  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "")
  const dateStamp = amzDate.slice(0, 8)

  const queryParams: Record<string, string> = {
    Action: action,
    Version: "2016-11-15",
    ...params,
  }

  const body = new URLSearchParams(queryParams).toString()

  const canonicalUri = "/"
  const canonicalQueryString = ""
  const canonicalHeaders = [
    ["content-type", "application/x-www-form-urlencoded; charset=utf-8"],
    ["host", host],
    ["x-amz-date", amzDate],
  ]
    .map(([k, v]) => `${k}:${v}\n`)
    .join("")

  const signedHeaders = "content-type;host;x-amz-date"
  const payloadHash = sha256Hex(body)

  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n")

  const algorithm = "AWS4-HMAC-SHA256"
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
  const stringToSign = [algorithm, amzDate, credentialScope, sha256Hex(canonicalRequest)].join("\n")

  const signingKey = getSignatureKey(secretAccessKey, dateStamp, region, service)
  const signature = crypto.createHmac("sha256", signingKey as any).update(stringToSign, "utf8").digest("hex")

  const authorizationHeader = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
    "X-Amz-Date": amzDate,
    Authorization: authorizationHeader,
  }

  const res = await fetch(endpoint, {
    method,
    headers,
    body,
  })

  const text = await res.text()
  if (!res.ok) {
    throw new Error(`EC2 error ${res.status}: ${text}`)
  }
  return text
}

function parseXmlInstances(xml: string): any[] {
  const instances: any[] = []

  console.log("[v0] Starting XML parse for instances")

  // Parse all reservations
  const reservationSetMatch = xml.match(/<reservationSet>([\s\S]*?)<\/reservationSet>/)
  if (!reservationSetMatch) {
    console.log("[v0] No reservationSet found")
    return instances
  }

  const reservationSetXml = reservationSetMatch[1]

  // Split by reservation item boundaries more explicitly
  const reservationBlocks = reservationSetXml.split(/<\/item>/).filter((block) => block.includes("<instancesSet>"))

  console.log(`[v0] Found ${reservationBlocks.length} reservation blocks`)

  for (const reservationBlock of reservationBlocks) {
    // Find instancesSet within this reservation
    const instancesSetMatch = reservationBlock.match(/<instancesSet>([\s\S]*?)(<\/instancesSet>|$)/)

    if (instancesSetMatch) {
      const instancesSetXml = instancesSetMatch[1]
      console.log("[v0] Found instancesSet block")

      // Split by </item> to get individual instances
      const instanceBlocks = instancesSetXml
        .split("</item>")
        .filter((block) => block.trim() && block.includes("<instanceId>"))

      console.log(`[v0] Found ${instanceBlocks.length} instance blocks in this set`)

      for (let i = 0; i < instanceBlocks.length; i++) {
        const itemXml = instanceBlocks[i]

        // Extract core instance data
        const instanceId = itemXml.match(/<instanceId>(.*?)<\/instanceId>/)?.[1]

        if (!instanceId) {
          console.log(`[v0] Skipping instance block ${i + 1}: no instanceId found`)
          continue
        }

        console.log(`[v0] Parsing instance ${i + 1}: ${instanceId}`)

        const instanceType = itemXml.match(/<instanceType>(.*?)<\/instanceType>/)?.[1]
        const stateMatch = itemXml.match(/<instanceState>([\s\S]*?)<\/instanceState>/)
        const state = stateMatch ? stateMatch[1].match(/<name>(.*?)<\/name>/)?.[1] : undefined
        const publicIp = itemXml.match(/<ipAddress>(.*?)<\/ipAddress>/)?.[1]
        const privateIp = itemXml.match(/<privateIpAddress>(.*?)<\/privateIpAddress>/)?.[1]
        const launchTime = itemXml.match(/<launchTime>(.*?)<\/launchTime>/)?.[1]

        // Parse tags
        const tags: Array<{ Key?: string; Value?: string }> = []
        const tagSetMatch = itemXml.match(/<tagSet>([\s\S]*?)<\/tagSet>/)

        if (tagSetMatch) {
          const tagSetXml = tagSetMatch[1]
          const tagBlocks = tagSetXml.split("</item>").filter((block) => block.trim() && block.includes("<key>"))

          for (const tagBlock of tagBlocks) {
            const key = tagBlock.match(/<key>(.*?)<\/key>/)?.[1]
            const value = tagBlock.match(/<value>(.*?)<\/value>/)?.[1]

            if (key !== undefined) {
              tags.push({ Key: key, Value: value })
            }
          }
        }

        instances.push({
          instanceId,
          instanceType,
          state,
          publicIp,
          privateIp,
          launchTime,
          tags,
        })
      }
    }
  }

  console.log(`[v0] Total instances parsed: ${instances.length}`)
  return instances
}

/**
 * Verify if a key pair exists in the region
 */
export async function describeKeyPairs(
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
  keyName?: string,
): Promise<any[]> {
  const params: Record<string, string> = {}

  if (keyName) {
    params["KeyName.1"] = keyName
  }

  try {
    const xml = await ec2Query(accessKeyId, secretAccessKey, region, "DescribeKeyPairs", params)

    const keyPairs: any[] = []
    const keyMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g)

    for (const match of keyMatches) {
      const itemXml = match[1]
      const name = itemXml.match(/<keyName>(.*?)<\/keyName>/)?.[1]
      const keyPairId = itemXml.match(/<keyPairId>(.*?)<\/keyPairId>/)?.[1]

      if (name) {
        keyPairs.push({ keyName: name, keyPairId })
      }
    }

    return keyPairs
  } catch (error) {
    // If the key doesn't exist, return empty array
    if (error instanceof Error && error.message.includes("InvalidKeyPair.NotFound")) {
      return []
    }
    throw error
  }
}

/**
 * Import a public SSH key to AWS EC2
 */
export async function importKeyPair(
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
  keyName: string,
  publicKeyMaterial: string,
): Promise<{ keyPairId: string | null; keyFingerprint: string | null }> {
  // AWS expects the public key to be base64 encoded
  const publicKeyBase64 = Buffer.from(publicKeyMaterial).toString("base64")

  const params: Record<string, string> = {
    KeyName: keyName,
    PublicKeyMaterial: publicKeyBase64,
  }

  try {
    const xml = await ec2Query(accessKeyId, secretAccessKey, region, "ImportKeyPair", params)

    const keyPairId = xml.match(/<keyPairId>(.*?)<\/keyPairId>/)?.[1] || null
    const keyFingerprint = xml.match(/<keyFingerprint>(.*?)<\/keyFingerprint>/)?.[1] || null

    return { keyPairId, keyFingerprint }
  } catch (error) {
    // If key already exists, we can still use it
    if (error instanceof Error && error.message.includes("InvalidKeyPair.Duplicate")) {
      console.warn(`[EC2] Key pair '${keyName}' already exists in region ${region}`)
      // Try to get the existing key info
      const existingKeys = await describeKeyPairs(accessKeyId, secretAccessKey, region, keyName)
      if (existingKeys.length > 0) {
        return { keyPairId: existingKeys[0].keyPairId || null, keyFingerprint: null }
      }
    }
    throw error
  }
}

export async function runInstance(
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
  config: {
    imageId: string
    instanceType: string
    keyName?: string
    storageSize: number
    instanceName: string
    userDataScript: string
    securityGroupId?: string
  },
): Promise<{ instanceId: string | null }> {
  const params: Record<string, string> = {
    ImageId: config.imageId,
    InstanceType: config.instanceType,
    MinCount: "1",
    MaxCount: "1",
    "BlockDeviceMapping.1.DeviceName": "/dev/sda1",
    "BlockDeviceMapping.1.Ebs.VolumeSize": config.storageSize.toString(),
    "BlockDeviceMapping.1.Ebs.VolumeType": "gp3",
    "TagSpecification.1.ResourceType": "instance",
    "TagSpecification.1.Tag.1.Key": "Name",
    "TagSpecification.1.Tag.1.Value": config.instanceName,
    UserData: Buffer.from(config.userDataScript).toString("base64"),
  }

  if (config.keyName && config.keyName.trim() !== "") {
    const keyPairs = await describeKeyPairs(accessKeyId, secretAccessKey, region, config.keyName)

    if (keyPairs.length > 0) {
      // Key exists, include it
      params.KeyName = config.keyName
    } else {
      // Key doesn't exist, log warning and proceed without it
      console.warn(
        `[EC2] Warning: Key pair '${config.keyName}' not found in region ${region}. Instance will launch without SSH key.`,
      )
    }
  }

  if (config.securityGroupId) {
    params["SecurityGroupId.1"] = config.securityGroupId
  }

  const xml = await ec2Query(accessKeyId, secretAccessKey, region, "RunInstances", params)
  const instanceId = xml.match(/<instanceId>(.*?)<\/instanceId>/)?.[1] || null

  return { instanceId }
}

export async function allocateAddress(
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
): Promise<{ allocationId: string | null; publicIp: string | null }> {
  const params = { Domain: "vpc" }
  const xml = await ec2Query(accessKeyId, secretAccessKey, region, "AllocateAddress", params)

  const allocationId = xml.match(/<allocationId>(.*?)<\/allocationId>/)?.[1] || null
  const publicIp = xml.match(/<publicIp>(.*?)<\/publicIp>/)?.[1] || null

  return { allocationId, publicIp }
}

export async function associateAddress(
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
  allocationId: string,
  instanceId: string,
): Promise<void> {
  const params = {
    AllocationId: allocationId,
    InstanceId: instanceId,
  }
  await ec2Query(accessKeyId, secretAccessKey, region, "AssociateAddress", params)
}

export async function startInstance(
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
  instanceId: string,
): Promise<void> {
  const params = { "InstanceId.1": instanceId }
  await ec2Query(accessKeyId, secretAccessKey, region, "StartInstances", params)
}

export async function stopInstance(
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
  instanceId: string,
): Promise<void> {
  const params = { "InstanceId.1": instanceId }
  await ec2Query(accessKeyId, secretAccessKey, region, "StopInstances", params)
}

export async function terminateInstance(
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
  instanceId: string,
): Promise<void> {
  const params = { "InstanceId.1": instanceId }
  await ec2Query(accessKeyId, secretAccessKey, region, "TerminateInstances", params)
}

export async function releaseAddress(
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
  allocationId: string,
): Promise<void> {
  const params = { AllocationId: allocationId }
  await ec2Query(accessKeyId, secretAccessKey, region, "ReleaseAddress", params)
}

export async function describeAddresses(
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
  instanceId?: string,
): Promise<any[]> {
  const params: Record<string, string> = {}

  if (instanceId) {
    params["Filter.1.Name"] = "instance-id"
    params["Filter.1.Value.1"] = instanceId
  }

  const xml = await ec2Query(accessKeyId, secretAccessKey, region, "DescribeAddresses", params)

  const addresses: any[] = []
  const addressMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g)

  for (const match of addressMatches) {
    const itemXml = match[1]
    const publicIp = itemXml.match(/<publicIp>(.*?)<\/publicIp>/)?.[1]
    const allocationId = itemXml.match(/<allocationId>(.*?)<\/allocationId>/)?.[1]
    const associationId = itemXml.match(/<associationId>(.*?)<\/associationId>/)?.[1]
    const instanceIdMatch = itemXml.match(/<instanceId>(.*?)<\/instanceId>/)?.[1]

    if (allocationId) {
      addresses.push({ publicIp, allocationId, associationId, instanceId: instanceIdMatch })
    }
  }

  return addresses
}

export async function describeInstanceStatus(
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
  instanceId: string,
): Promise<{ state: string | null }> {
  const params = {
    "InstanceId.1": instanceId,
    IncludeAllInstances: "true",
  }
  const xml = await ec2Query(accessKeyId, secretAccessKey, region, "DescribeInstanceStatus", params)
  const state = xml.match(/<name>(.*?)<\/name>/)?.[1] || null

  return { state }
}

export async function createSecurityGroup(
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
  groupName: string,
  description: string,
  vpcId?: string,
): Promise<{ groupId: string | null }> {
  const params: Record<string, string> = {
    GroupName: groupName,
    GroupDescription: description,
  }

  if (vpcId) {
    params.VpcId = vpcId
  }

  const xml = await ec2Query(accessKeyId, secretAccessKey, region, "CreateSecurityGroup", params)
  const groupId = xml.match(/<groupId>(.*?)<\/groupId>/)?.[1] || null

  return { groupId }
}

export async function authorizeSecurityGroupIngress(
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
  groupId: string,
  rules: Array<{ ipProtocol: string; fromPort: string; toPort: string; cidrIp: string }>,
): Promise<void> {
  const params: Record<string, string> = {
    GroupId: groupId,
  }

  rules.forEach((r, i) => {
    const n = i + 1
    params[`IpPermissions.${n}.IpProtocol`] = r.ipProtocol
    params[`IpPermissions.${n}.FromPort`] = r.fromPort
    params[`IpPermissions.${n}.ToPort`] = r.toPort
    params[`IpPermissions.${n}.IpRanges.1.CidrIp`] = r.cidrIp
  })

  await ec2Query(accessKeyId, secretAccessKey, region, "AuthorizeSecurityGroupIngress", params)
}

export async function describeSecurityGroups(
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
  groupName?: string,
): Promise<any[]> {
  const params: Record<string, string> = {}

  if (groupName) {
    params["Filter.1.Name"] = "group-name"
    params["Filter.1.Value.1"] = groupName
  }

  const xml = await ec2Query(accessKeyId, secretAccessKey, region, "DescribeSecurityGroups", params)

  const groups: any[] = []
  const groupMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g)

  for (const match of groupMatches) {
    const itemXml = match[1]
    const groupId = itemXml.match(/<groupId>(.*?)<\/groupId>/)?.[1]
    const groupNameMatch = itemXml.match(/<groupName>(.*?)<\/groupName>/)?.[1]
    const vpcId = itemXml.match(/<vpcId>(.*?)<\/vpcId>/)?.[1]

    if (groupId) {
      groups.push({ groupId, groupName: groupNameMatch, vpcId })
    }
  }

  return groups
}

export async function describeVpcs(accessKeyId: string, secretAccessKey: string, region: string): Promise<any[]> {
  const xml = await ec2Query(accessKeyId, secretAccessKey, region, "DescribeVpcs")

  const vpcs: any[] = []
  const vpcMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g)

  for (const match of vpcMatches) {
    const itemXml = match[1]
    const vpcId = itemXml.match(/<vpcId>(.*?)<\/vpcId>/)?.[1]
    const isDefault = itemXml.match(/<isDefault>(.*?)<\/isDefault>/)?.[1] === "true"
    const cidrBlock = itemXml.match(/<cidrBlock>(.*?)<\/cidrBlock>/)?.[1]

    if (vpcId) {
      vpcs.push({ vpcId, isDefault, cidrBlock })
    }
  }

  return vpcs
}

export async function createOrGetDokploySecurityGroup(
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
): Promise<{ groupId: string }> {
  try {
    // Check if security group already exists
    const existingGroups = await describeSecurityGroups(accessKeyId, secretAccessKey, region, "dokploy-sg")

    if (existingGroups.length > 0) {
      return { groupId: existingGroups[0].groupId }
    }

    // Get default VPC
    const vpcs = await describeVpcs(accessKeyId, secretAccessKey, region)
    const defaultVpc = vpcs.find((v) => v.isDefault)

    // Create security group
    const { groupId } = await createSecurityGroup(
      accessKeyId,
      secretAccessKey,
      region,
      "dokploy-sg",
      "Dokploy security group - SSH, HTTP, HTTPS, and port 3000",
      defaultVpc?.vpcId,
    )

    if (!groupId) {
      throw new Error("Failed to create security group")
    }

    // Authorize ingress rules for SSH, HTTP, HTTPS, and Dokploy (port 3000)
    const rules = [
      { ipProtocol: "tcp", fromPort: "22", toPort: "22", cidrIp: "0.0.0.0/0" }, // SSH
      { ipProtocol: "tcp", fromPort: "80", toPort: "80", cidrIp: "0.0.0.0/0" }, // HTTP
      { ipProtocol: "tcp", fromPort: "443", toPort: "443", cidrIp: "0.0.0.0/0" }, // HTTPS
      { ipProtocol: "tcp", fromPort: "3000", toPort: "3000", cidrIp: "0.0.0.0/0" }, // Dokploy UI
    ]

    await authorizeSecurityGroupIngress(accessKeyId, secretAccessKey, region, groupId, rules)

    return { groupId }
  } catch (error) {
    console.error("[v0] Error creating Dokploy security group:", error)
    throw error
  }
}

export async function describeInstances(accessKeyId: string, secretAccessKey: string, region: string): Promise<any[]> {
  const xml = await ec2Query(accessKeyId, secretAccessKey, region, "DescribeInstances")
  return parseXmlInstances(xml)
}

export function createEC2Client(accessKeyId: string, secretAccessKey: string, region: string) {
  return {
    describeInstances: () => describeInstances(accessKeyId, secretAccessKey, region),
    describeKeyPairs: (keyName?: string) => describeKeyPairs(accessKeyId, secretAccessKey, region, keyName),
    importKeyPair: (keyName: string, publicKeyMaterial: string) =>
      importKeyPair(accessKeyId, secretAccessKey, region, keyName, publicKeyMaterial),
    runInstance: (config: Parameters<typeof runInstance>[3]) =>
      runInstance(accessKeyId, secretAccessKey, region, config),
    allocateAddress: () => allocateAddress(accessKeyId, secretAccessKey, region),
    associateAddress: (allocationId: string, instanceId: string) =>
      associateAddress(accessKeyId, secretAccessKey, region, allocationId, instanceId),
    startInstance: (instanceId: string) => startInstance(accessKeyId, secretAccessKey, region, instanceId),
    stopInstance: (instanceId: string) => stopInstance(accessKeyId, secretAccessKey, region, instanceId),
    terminateInstance: (instanceId: string) => terminateInstance(accessKeyId, secretAccessKey, region, instanceId),
    releaseAddress: (allocationId: string) => releaseAddress(accessKeyId, secretAccessKey, region, allocationId),
    describeAddresses: (instanceId?: string) => describeAddresses(accessKeyId, secretAccessKey, region, instanceId),
    describeInstanceStatus: (instanceId: string) =>
      describeInstanceStatus(accessKeyId, secretAccessKey, region, instanceId),
    createSecurityGroup: (groupName: string, description: string, vpcId?: string) =>
      createSecurityGroup(accessKeyId, secretAccessKey, region, groupName, description, vpcId),
    authorizeSecurityGroupIngress: (groupId: string, rules: Parameters<typeof authorizeSecurityGroupIngress>[3]) =>
      authorizeSecurityGroupIngress(accessKeyId, secretAccessKey, region, groupId, rules as any),
    describeSecurityGroups: (groupName?: string) =>
      describeSecurityGroups(accessKeyId, secretAccessKey, region, groupName),
    describeVpcs: () => describeVpcs(accessKeyId, secretAccessKey, region),
    createOrGetDokploySecurityGroup: () => createOrGetDokploySecurityGroup(accessKeyId, secretAccessKey, region),
  }
}
