import { NextRequest, NextResponse } from "next/server";

type NpmTimeInfo = {
  modified?: string;
  created?: string;
  // additional keys are version strings mapping to ISO timestamps
  [version: string]: string | undefined;
};

type NpmRegistryResponse = {
  name?: string;
  description?: string;
  license?: string;
  author?: { name?: string } | string;
  "dist-tags"?: { latest?: string };
  time?: NpmTimeInfo;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      packages?: string[];
    };

    const packages = Array.isArray(body.packages)
      ? body.packages.filter((p) => typeof p === "string" && p.trim().length > 0)
      : [];

    if (packages.length === 0) {
      return NextResponse.json({}, { status: 200 });
    }

    const results: Record<string, any> = {};

    await Promise.all(
      packages.map(async (pkg) => {
        try {
          const res = await fetch(
            `https://registry.npmjs.org/${encodeURIComponent(pkg)}`,
          );
          if (!res.ok) {
            results[pkg] = { _error: true };
            return;
          }

          const data = (await res.json()) as NpmRegistryResponse;
          const time = data.time ?? {};

          const modified = time.modified;
          const latestVersion = data["dist-tags"]?.latest;
          const latestPublished =
            (latestVersion && time[latestVersion]) || undefined;

          results[pkg] = {
            name: data.name ?? pkg,
            description: data.description ?? "",
            version: latestVersion,
            author:
              typeof data.author === "string"
                ? { name: data.author }
                : data.author ?? undefined,
            license: data.license ?? undefined,
            lastUpdated: modified ?? latestPublished ?? null,
          };
        } catch {
          results[pkg] = { _error: true };
        }
      }),
    );

    return NextResponse.json(results, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch npm metadata" },
      { status: 500 },
    );
  }
}

