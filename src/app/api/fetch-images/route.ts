import { NextResponse } from "next/server";
import { db } from "@/db";
import { games } from "@/db/schema";
import { eq } from "drizzle-orm";

interface CheapSharkGame {
  gameID: string;
  steamAppID: string;
  external: string;
  thumb: string;
}

interface CheapSharkDeal {
  title: string;
  steamAppID: string;
  thumb: string;
  gameID: string;
}

export async function POST() {
  try {
    const allGames = await db.select().from(games);
    let updated = 0;
    let failed = 0;
    const results: { title: string; image: string; status: string }[] = [];

    for (const game of allGames) {
      try {
        // Search CheapShark for this game
        const searchQuery = encodeURIComponent(game.title);
        const searchUrl = `https://www.cheapshark.com/api/1.0/games?title=${searchQuery}&limit=5`;
        
        const searchRes = await fetch(searchUrl, {
          signal: AbortSignal.timeout(8000),
        });
        
        if (!searchRes.ok) {
          failed++;
          results.push({ title: game.title, image: "search_failed", status: "failed" });
          continue;
        }

        const searchResults: CheapSharkGame[] = await searchRes.json();

        // Try to find exact or close match
        let bestMatch: CheapSharkGame | null = null;
        
        if (searchResults.length > 0) {
          // Try exact match first
          bestMatch = searchResults.find(
            (r) => r.external.toLowerCase() === game.title.toLowerCase()
          ) || null;

          // If no exact match, try partial match
          if (!bestMatch) {
            bestMatch = searchResults.find(
              (r) =>
                r.external.toLowerCase().includes(game.title.toLowerCase()) ||
                game.title.toLowerCase().includes(r.external.toLowerCase())
            ) || null;
          }

          // If still no match, take first result
          if (!bestMatch && searchResults.length > 0) {
            bestMatch = searchResults[0];
          }
        }

        let imageUrl = "";

        if (bestMatch && bestMatch.steamAppID) {
          // Use Steam header image (high quality 460x215)
          imageUrl = `https://cdn.akamai.steamstatic.com/steam/apps/${bestMatch.steamAppID}/header.jpg`;
        } else if (bestMatch && bestMatch.thumb) {
          // Use CheapShark thumb as fallback
          imageUrl = bestMatch.thumb;
        } else {
          // Try searching deals for more results
          const dealUrl = `https://www.cheapshark.com/api/1.0/deals?title=${searchQuery}&pageSize=3`;
          try {
            const dealRes = await fetch(dealUrl, {
              signal: AbortSignal.timeout(8000),
            });
            if (dealRes.ok) {
              const dealData: { list: CheapSharkDeal[] } | CheapSharkDeal[] = await dealRes.json();
              const deals = Array.isArray(dealData) ? dealData : (dealData as { list: CheapSharkDeal[] }).list || [];
              
              if (deals.length > 0) {
                const deal = deals[0];
                if (deal.steamAppID) {
                  imageUrl = `https://cdn.akamai.steamstatic.com/steam/apps/${deal.steamAppID}/header.jpg`;
                } else if (deal.thumb) {
                  imageUrl = deal.thumb;
                }
              }
            }
          } catch {
            // Continue without deal image
          }
        }

        if (imageUrl) {
          await db
            .update(games)
            .set({ coverImage: imageUrl, updatedAt: new Date() })
            .where(eq(games.id, game.id));
          updated++;
          results.push({ title: game.title, image: imageUrl, status: "updated" });
        } else {
          failed++;
          results.push({ title: game.title, image: "not_found", status: "not_found" });
        }

        // Rate limit: wait 300ms between requests to be respectful
        await new Promise((resolve) => setTimeout(resolve, 300));

      } catch (err) {
        failed++;
        results.push({ title: game.title, image: "error", status: "error" });
        console.error(`Error fetching image for ${game.title}:`, err);
      }
    }

    return NextResponse.json({
      message: `Updated ${updated} games with real images. ${failed} failed.`,
      updated,
      failed,
      total: allGames.length,
      results,
    });
  } catch (error) {
    console.error("Error in fetch-images:", error);
    return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
  }
}
