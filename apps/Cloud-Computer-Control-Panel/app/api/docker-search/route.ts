import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query")

    if (!query) {
      return NextResponse.json({ message: "Query parameter is required" }, { status: 400 })
    }

    console.log("[v0] Searching Docker Hub for:", query)

    const response = await fetch(
      `https://hub.docker.com/v2/search/repositories/?query=${encodeURIComponent(query)}&page_size=10`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      throw new Error(`Docker Hub API returned ${response.status}`)
    }

    const data = await response.json()

    console.log("[v0] Docker Hub API response:", JSON.stringify(data, null, 2))
    console.log("[v0] Number of results:", data.results?.length || 0)

    const results = (data.results || []).map((item: any) => ({
      name: item.repo_name || item.name || "unknown",
      description: item.short_description || item.description || "",
      star_count: item.star_count || 0,
      pull_count: item.pull_count || 0,
      is_official: item.is_official || false,
      is_automated: item.is_automated || false,
    }))

    console.log(
      "[v0] Processed results:",
      results.map((r: any) => r.name),
    )

    return NextResponse.json({
      results,
      count: data.count || 0,
    })
  } catch (error) {
    console.error("[v0] Error searching Docker Hub:", error)
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Failed to search Docker Hub",
        results: [],
      },
      { status: 500 },
    )
  }
}
