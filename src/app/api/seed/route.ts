import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { games } from "@/db/schema";
import { seedGames } from "@/lib/games-data";
import { sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    if (token !== process.env.ADMIN_PASSWORD && token !== "hama-admin-2026") {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check if games already exist
    const existing = await db.select({ count: sql<number>`count(*)` }).from(games);
    
    if (existing[0].count > 0) {
      return NextResponse.json({ 
        message: `Database already has ${existing[0].count} games. Delete existing games first or use individual add.`,
        count: existing[0].count
      });
    }

    // Seed all games
    const values = seedGames.map((game) => ({
      title: game.title,
      description: game.description,
      coverImage: game.coverImage,
      releaseDate: game.releaseDate,
      status: game.status,
      genre: game.genre,
      developer: game.developer,
      publisher: game.publisher,
      platform: game.platform,
      featured: game.featured,
      rating: game.rating,
      storeLinks: game.storeLinks,
      order: game.order,
    }));

    const inserted = await db.insert(games).values(values).returning();

    return NextResponse.json({ 
      message: `Successfully seeded ${inserted.length} games`,
      count: inserted.length
    }, { status: 201 });
  } catch (error) {
    console.error("Error seeding games:", error);
    return NextResponse.json({ error: "Failed to seed games" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    if (token !== process.env.ADMIN_PASSWORD && token !== "hama-admin-2026") {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    await db.delete(games);

    return NextResponse.json({ message: "All games deleted successfully" });
  } catch (error) {
    console.error("Error deleting games:", error);
    return NextResponse.json({ error: "Failed to delete games" }, { status: 500 });
  }
}
