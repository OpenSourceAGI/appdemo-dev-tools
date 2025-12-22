import { NextResponse } from "next/server"

export async function GET() {
  // Check if AWS credentials are set in environment variables
  const hasCredentials = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)

  return NextResponse.json({
    hasCredentials,
    region: process.env.AWS_REGION || "us-east-1",
  })
}
