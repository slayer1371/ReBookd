import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  try {
    // Nominatim requires a User-Agent header
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`,
      {
        headers: {
          "User-Agent": "ReBookd/1.0 (rebookd.com)",
        },
      }
    );

    if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const { lat, lon } = data[0];
      return NextResponse.json({ lat: parseFloat(lat), lng: parseFloat(lon) });
    }

    return NextResponse.json({ error: "Location not found" }, { status: 404 });
  } catch (error) {
    console.error("Geocoding error:", error);
    return NextResponse.json({ error: "Failed to fetch coordinates" }, { status: 500 });
  }
}
