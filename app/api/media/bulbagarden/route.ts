import { NextRequest, NextResponse } from "next/server";
import { isBulbagardenMediaUrl } from "@/lib/remote-image";

const IMAGE_CACHE_SECONDS = 60 * 60 * 24 * 7;

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const sourceUrl = request.nextUrl.searchParams.get("src");

  if (!sourceUrl) {
    return NextResponse.json({ error: "Missing image source." }, { status: 400 });
  }

  if (!isBulbagardenMediaUrl(sourceUrl)) {
    return NextResponse.json({ error: "Image source is not allowed." }, { status: 403 });
  }

  let upstreamResponse: Response;

  try {
    upstreamResponse = await fetch(sourceUrl, {
      headers: {
        Accept:
          request.headers.get("accept") ??
          "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "User-Agent": "DexLoom Image Proxy/1.0"
      },
      next: { revalidate: IMAGE_CACHE_SECONDS }
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch upstream image." }, { status: 502 });
  }

  if (!upstreamResponse.ok) {
    return NextResponse.json(
      { error: "Upstream image request failed." },
      { status: upstreamResponse.status === 404 ? 404 : 502 }
    );
  }

  const contentType = upstreamResponse.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("image/")) {
    return NextResponse.json({ error: "Upstream response is not an image." }, { status: 415 });
  }

  const headers = new Headers();
  headers.set("Content-Type", contentType);
  headers.set(
    "Cache-Control",
    `public, max-age=${IMAGE_CACHE_SECONDS}, s-maxage=${IMAGE_CACHE_SECONDS}, stale-while-revalidate=${IMAGE_CACHE_SECONDS}`
  );
  headers.set("X-Content-Type-Options", "nosniff");

  const contentLength = upstreamResponse.headers.get("content-length");
  if (contentLength) {
    headers.set("Content-Length", contentLength);
  }

  return new NextResponse(upstreamResponse.body, {
    status: 200,
    headers
  });
}
