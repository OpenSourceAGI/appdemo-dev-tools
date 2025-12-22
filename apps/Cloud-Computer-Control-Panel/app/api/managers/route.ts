export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { EC2Client, DescribeInstancesCommand } from "@aws-sdk/client-ec2"
import { fromEnv } from "@aws-sdk/credential-providers"
import { runInstance } from "@/lib/aws-ec2-client"
import { getUbuntuAMI } from "@/lib/aws-ami-ids"

function createEC2Client(accessKeyId: string | null, secretAccessKey: string | null, region: string) {
  if (!accessKeyId || !secretAccessKey) {
    return new EC2Client({
      region,
      credentials: fromEnv(),
    })
  }

  return new EC2Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    let accessKeyId: string
    let secretAccessKey: string

    if (body.accessKeyId === "env") {
      accessKeyId = process.env.AWS_ACCESS_KEY_ID || ""
      secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || ""
    } else {
      accessKeyId = body.accessKeyId
      secretAccessKey = body.secretAccessKey
    }

    if (!accessKeyId || !secretAccessKey) {
      return NextResponse.json({ message: "AWS credentials are required" }, { status: 400 })
    }

    const region = body.region || process.env.AWS_REGION || "us-east-1"
    const { config } = body

    const userData = `#!/bin/bash
set -e

apt-get update
apt-get upgrade -y

curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

${
  config.setupDokploy
    ? `
curl -sSL https://dokploy.com/install.sh | sh
docker swarm init
echo "Dokploy installed! Access at http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000"
`
    : ""
}

${
  config.setupDevEnvironment && config.devTools?.length > 0
    ? `
${config.devTools.includes("git") ? "apt-get install -y git" : ""}
${config.devTools.includes("nodejs") ? "curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs" : ""}
${config.devTools.includes("python3") ? "apt-get install -y python3 python3-pip" : ""}
${config.devTools.includes("nginx") ? "apt-get install -y nginx" : ""}
`
    : ""
}

echo "Setup complete!" > /var/log/user-data-complete.log
`

    const { instanceId } = await runInstance(accessKeyId, secretAccessKey, region, {
      imageId: getUbuntuAMI(region),
      instanceType: config.instanceType || "t3.small",
      keyName: config.keyName,
      storageSize: config.storageSize || 40,
      instanceName: config.instanceName || "Dokploy Server",
      userDataScript: userData,
    })

    return NextResponse.json({
      instanceId,
      message: "Instance creation initiated",
    })
  } catch (error) {
    console.error("[v0] Error creating EC2 instance:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to create instance" },
      { status: 500 },
    )
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const instanceId = url.searchParams.get("instanceId")

    let accessKeyId: string | null = null
    let secretAccessKey: string | null = null

    if (url.searchParams.get("accessKeyId") === "env") {
      accessKeyId = null
      secretAccessKey = null
    } else {
      accessKeyId = url.searchParams.get("accessKeyId")
      secretAccessKey = url.searchParams.get("secretAccessKey")
    }

    const region = url.searchParams.get("region") || process.env.AWS_REGION || "us-east-1"

    const ec2Client = createEC2Client(accessKeyId, secretAccessKey, region)

    const command = new DescribeInstancesCommand({
      InstanceIds: instanceId ? [instanceId] : undefined,
    })

    const response = await ec2Client.send(command)
    const instance = response.Reservations?.[0]?.Instances?.[0]

    return NextResponse.json({
      instanceId: instance?.InstanceId,
      state: instance?.State?.Name,
      publicIp: instance?.PublicIpAddress,
      privateIp: instance?.PrivateIpAddress,
    })
  } catch (error) {
    console.error("[v0] Error fetching instance status:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to fetch status" },
      { status: 500 },
    )
  }
}
