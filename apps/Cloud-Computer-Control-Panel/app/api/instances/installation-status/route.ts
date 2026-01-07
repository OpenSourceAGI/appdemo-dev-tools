import { type NextRequest, NextResponse } from "next/server"
import { createSSMClient } from "@/lib/aws-ssm-client"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { commandId, instanceId, region } = body

    if (!commandId || !instanceId || !region) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Get credentials from headers or environment
    const accessKeyId = req.headers.get("x-aws-access-key-id") || process.env.AWS_ACCESS_KEY_ID
    const secretAccessKey = req.headers.get("x-aws-secret-access-key") || process.env.AWS_SECRET_ACCESS_KEY

    if (!accessKeyId || !secretAccessKey) {
      return NextResponse.json({ error: "AWS credentials not provided" }, { status: 401 })
    }

    const ssm = createSSMClient(accessKeyId, secretAccessKey, region)

    // Get command invocation status
    const invocation = await ssm.getCommandInvocation(commandId, instanceId)

    return NextResponse.json({
      status: invocation.status,
      statusDetails: invocation.statusDetails,
      output: invocation.standardOutput,
      error: invocation.standardError,
    })
  } catch (error: any) {
    console.error("[v0] Error checking installation status:", error)

    // Handle SSM-specific errors
    if (error.message?.includes("InvalidInstanceId")) {
      return NextResponse.json(
        {
          error: "Instance not managed by SSM",
          message: "The instance doesn't have SSM agent installed or doesn't have the required IAM role.",
        },
        { status: 400 },
      )
    }

    if (error.message?.includes("InvocationDoesNotExist")) {
      return NextResponse.json(
        {
          error: "Command not found",
          message: "The command invocation was not found.",
        },
        { status: 404 },
      )
    }

    return NextResponse.json({ error: error.message || "Failed to check installation status" }, { status: 500 })
  }
}
