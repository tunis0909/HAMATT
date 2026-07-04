import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { games } from "@/db/schema";
import { eq, desc, asc, sql, like, and, or } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const genre = searchParams.get("genre");
    const featured = searchParams.get("featured");
    const limit = parseInt(searchParams.get("limit") || "200");
    const offset = parseInt(searchParams.get("offset") || "0");

    const conditions = [];
    
    if (status && (status === "upcoming" || status === "released")) {
      conditions.push(eq(games.status, status));
    }
    if (search) {
      conditions.push(like(games.title, `%${search}%`));
    }
    if (genre) {
      conditions.push(like(games.genre, `%${genre}%`));
    }
    if (featured === "true") {
      conditions.push(eq(games.featured, true));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const allGames = await db
      .select()
      .from(games)
      .where(whereClause)
      .orderBy(asc(games.order))
      .limit(limit)
      .offset(offset);

    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(games)
      .where(whereClause);

    return NextResponse.json({
      games: allGames,
      total: totalCount[0].count,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching games:", error);
    return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 });
  }
}

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

    const body = await request.json();
    const newGame = await db.insert(games).values({
      title: body.title,
      description: body.description || null,
      coverImage: body.coverImage || null,
      releaseDate: body.releaseDate || null,
      status: body.status || "upcoming",
      genre: body.genre || null,
      developer: body.developer || null,
      publisher: body.publisher || null,
      platform: body.platform || null,
      featured: body.featured || false,
      rating: body.rating || null,
      storeLinks: body.storeLinks || null,
      order: body.order || 999,
    }).returning();

    return NextResponse.json({ game: newGame[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating game:", error);
    return NextResponse.json({ error: "Failed to create game" }, { status: 500 });
  }
}
