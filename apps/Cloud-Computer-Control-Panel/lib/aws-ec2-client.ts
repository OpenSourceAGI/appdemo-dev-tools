import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeKeyPairsCommand,
  ImportKeyPairCommand,
  RunInstancesCommand,
  AllocateAddressCommand,
  AssociateAddressCommand,
  StartInstancesCommand,
  StopInstancesCommand,
  TerminateInstancesCommand,
  ReleaseAddressCommand,
  DescribeAddressesCommand,
  DescribeInstanceStatusCommand,
  CreateSecurityGroupCommand,
  AuthorizeSecurityGroupIngressCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcsCommand,
  type Instance,
  type Tag,
} from "@aws-sdk/client-ec2"

function createClient(accessKeyId: string, secretAccessKey: string, region: string): EC2Client {
  return new EC2Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })
}

interface ParsedInstance {
  instanceId?: string
  instanceType?: string
  state?: string
  publicIp?: string
  privateIp?: string
  launchTime?: string
  tags: Array<{ Key?: string; Value?: string }>
}

function parseInstance(instance: Instance): ParsedInstance {
  return {
    instanceId: instance.InstanceId,
    instanceType: instance.InstanceType,
    state: instance.State?.Name,
    publicIp: instance.PublicIpAddress,
    privateIp: instance.PrivateIpAddress,
    launchTime: instance.LaunchTime?.toISOString(),
    tags: (instance.Tags as Tag[] | undefined)?.map((tag) => ({
      Key: tag.Key,
      Value: tag.Value,
    })) || [],
  }
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
  const client = createClient(accessKeyId, secretAccessKey, region)

  try {
    const command = new DescribeKeyPairsCommand({
      KeyNames: keyName ? [keyName] : undefined,
    })

    const response = await client.send(command)

    return (response.KeyPairs || []).map((kp) => ({
      keyName: kp.KeyName,
      keyPairId: kp.KeyPairId,
    }))
  } catch (error) {
    // If the key doesn't exist, return empty array
    if (error instanceof Error && error.name === "InvalidKeyPair.NotFound") {
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
  const client = createClient(accessKeyId, secretAccessKey, region)

  // AWS SDK expects the public key as a Buffer or Uint8Array
  const publicKeyBuffer = Buffer.from(publicKeyMaterial)

  try {
    const command = new ImportKeyPairCommand({
      KeyName: keyName,
      PublicKeyMaterial: publicKeyBuffer,
    })

    const response = await client.send(command)

    return {
      keyPairId: response.KeyPairId || null,
      keyFingerprint: response.KeyFingerprint || null,
    }
  } catch (error) {
    // If key already exists, we can still use it
    if (error instanceof Error && error.name === "InvalidKeyPair.Duplicate") {
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
  const client = createClient(accessKeyId, secretAccessKey, region)

  // Verify key exists if provided
  if (config.keyName && config.keyName.trim() !== "") {
    const keyPairs = await describeKeyPairs(accessKeyId, secretAccessKey, region, config.keyName)

    if (keyPairs.length === 0) {
      // Key doesn't exist, log warning and proceed without it
      console.warn(
        `[EC2] Warning: Key pair '${config.keyName}' not found in region ${region}. Instance will launch without SSH key.`,
      )
      config.keyName = undefined
    }
  }

  const command = new RunInstancesCommand({
    ImageId: config.imageId,
    InstanceType: config.instanceType as any,
    MinCount: 1,
    MaxCount: 1,
    KeyName: config.keyName || undefined,
    BlockDeviceMappings: [
      {
        DeviceName: "/dev/sda1",
        Ebs: {
          VolumeSize: config.storageSize,
          VolumeType: "gp3",
        },
      },
    ],
    TagSpecifications: [
      {
        ResourceType: "instance",
        Tags: [
          {
            Key: "Name",
            Value: config.instanceName,
          },
        ],
      },
    ],
    UserData: Buffer.from(config.userDataScript).toString("base64"),
    SecurityGroupIds: config.securityGroupId ? [config.securityGroupId] : undefined,
  })

  const response = await client.send(command)
  const instanceId = response.Instances?.[0]?.InstanceId || null

  return { instanceId }
}

export async function allocateAddress(
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
): Promise<{ allocationId: string | null; publicIp: string | null }> {
  const client = createClient(accessKeyId, secretAccessKey, region)

  const command = new AllocateAddressCommand({
    Domain: "vpc",
  })

  const response = await client.send(command)

  return {
    allocationId: response.AllocationId || null,
    publicIp: response.PublicIp || null,
  }
}

export async function associateAddress(
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
  allocationId: string,
  instanceId: string,
): Promise<void> {
  const client = createClient(accessKeyId, secretAccessKey, region)

  const command = new AssociateAddressCommand({
    AllocationId: allocationId,
    InstanceId: instanceId,
  })

  await client.send(command)
}

export async function startInstance(
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
  instanceId: string,
): Promise<void> {
  const client = createClient(accessKeyId, secretAccessKey, region)

  const command = new StartInstancesCommand({
    InstanceIds: [instanceId],
  })

  await client.send(command)
}

export async function stopInstance(
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
  instanceId: string,
): Promise<void> {
  const client = createClient(accessKeyId, secretAccessKey, region)

  const command = new StopInstancesCommand({
    InstanceIds: [instanceId],
  })

  await client.send(command)
}

export async function terminateInstance(
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
  instanceId: string,
): Promise<void> {
  const client = createClient(accessKeyId, secretAccessKey, region)

  const command = new TerminateInstancesCommand({
    InstanceIds: [instanceId],
  })

  await client.send(command)
}

export async function releaseAddress(
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
  allocationId: string,
): Promise<void> {
  const client = createClient(accessKeyId, secretAccessKey, region)

  const command = new ReleaseAddressCommand({
    AllocationId: allocationId,
  })

  await client.send(command)
}

export async function describeAddresses(
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
  instanceId?: string,
): Promise<any[]> {
  const client = createClient(accessKeyId, secretAccessKey, region)

  const command = new DescribeAddressesCommand({
    Filters: instanceId
      ? [
          {
            Name: "instance-id",
            Values: [instanceId],
          },
        ]
      : undefined,
  })

  const response = await client.send(command)

  return (response.Addresses || []).map((addr) => ({
    publicIp: addr.PublicIp,
    allocationId: addr.AllocationId,
    associationId: addr.AssociationId,
    instanceId: addr.InstanceId,
  }))
}

export async function describeInstanceStatus(
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
  instanceId: string,
): Promise<{ state: string | null }> {
  const client = createClient(accessKeyId, secretAccessKey, region)

  const command = new DescribeInstanceStatusCommand({
    InstanceIds: [instanceId],
    IncludeAllInstances: true,
  })

  const response = await client.send(command)
  const state = response.InstanceStatuses?.[0]?.InstanceState?.Name || null

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
  const client = createClient(accessKeyId, secretAccessKey, region)

  const command = new CreateSecurityGroupCommand({
    GroupName: groupName,
    Description: description,
    VpcId: vpcId,
  })

  const response = await client.send(command)

  return {
    groupId: response.GroupId || null,
  }
}

export async function authorizeSecurityGroupIngress(
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
  groupId: string,
  rules: Array<{ ipProtocol: string; fromPort: string; toPort: string; cidrIp: string }>,
): Promise<void> {
  const client = createClient(accessKeyId, secretAccessKey, region)

  const command = new AuthorizeSecurityGroupIngressCommand({
    GroupId: groupId,
    IpPermissions: rules.map((rule) => ({
      IpProtocol: rule.ipProtocol,
      FromPort: parseInt(rule.fromPort, 10),
      ToPort: parseInt(rule.toPort, 10),
      IpRanges: [
        {
          CidrIp: rule.cidrIp,
        },
      ],
    })),
  })

  await client.send(command)
}

export async function describeSecurityGroups(
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
  groupName?: string,
): Promise<any[]> {
  const client = createClient(accessKeyId, secretAccessKey, region)

  const command = new DescribeSecurityGroupsCommand({
    Filters: groupName
      ? [
          {
            Name: "group-name",
            Values: [groupName],
          },
        ]
      : undefined,
  })

  const response = await client.send(command)

  return (response.SecurityGroups || []).map((sg) => ({
    groupId: sg.GroupId,
    groupName: sg.GroupName,
    vpcId: sg.VpcId,
  }))
}

export async function describeVpcs(accessKeyId: string, secretAccessKey: string, region: string): Promise<any[]> {
  const client = createClient(accessKeyId, secretAccessKey, region)

  const command = new DescribeVpcsCommand({})

  const response = await client.send(command)

  return (response.Vpcs || []).map((vpc) => ({
    vpcId: vpc.VpcId,
    isDefault: vpc.IsDefault || false,
    cidrBlock: vpc.CidrBlock,
  }))
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

    // Get VPC - prefer default VPC, but fall back to first available VPC
    const vpcs = await describeVpcs(accessKeyId, secretAccessKey, region)
    const defaultVpc = vpcs.find((v) => v.isDefault)
    const targetVpc = defaultVpc || vpcs[0]

    if (!targetVpc) {
      throw new Error("No VPC available in this region. Please create a VPC first.")
    }

    console.log(
      `[EC2] Using VPC ${targetVpc.vpcId} (${defaultVpc ? "default" : "first available"}) for security group`,
    )

    // Create security group
    const { groupId } = await createSecurityGroup(
      accessKeyId,
      secretAccessKey,
      region,
      "dokploy-sg",
      "Dokploy security group - SSH, HTTP, HTTPS, and port 3000",
      targetVpc.vpcId,
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
    console.error("[EC2] Error creating Dokploy security group:", error)
    throw error
  }
}

export async function describeInstances(accessKeyId: string, secretAccessKey: string, region: string): Promise<any[]> {
  const client = createClient(accessKeyId, secretAccessKey, region)

  const command = new DescribeInstancesCommand({})

  const response = await client.send(command)

  const instances: ParsedInstance[] = []

  for (const reservation of response.Reservations || []) {
    for (const instance of reservation.Instances || []) {
      instances.push(parseInstance(instance))
    }
  }

  return instances
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
