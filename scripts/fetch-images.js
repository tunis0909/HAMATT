const { Pool } = require("pg");

const pool = new Pool({
  connectionString: "postgresql://postgres:postgres@127.0.0.1:5432/app_db",
});

async function fetchJSON(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function main() {
  const client = await pool.connect();
  
  try {
    const { rows: allGames } = await client.query("SELECT id, title, cover_image FROM games ORDER BY id");
    
    let updated = 0;
    let failed = 0;
    
    console.log(`Processing ${allGames.length} games...\n`);
    
    for (const game of allGames) {
      try {
        const searchQuery = encodeURIComponent(game.title);
        const searchUrl = `https://www.cheapshark.com/api/1.0/games?title=${searchQuery}&limit=5`;
        
        const searchResults = await fetchJSON(searchUrl);
        
        let bestMatch = null;
        
        if (searchResults.length > 0) {
          // Try exact match
          bestMatch = searchResults.find(
            (r) => r.external.toLowerCase() === game.title.toLowerCase()
          );
          
          // Try partial match
          if (!bestMatch) {
            bestMatch = searchResults.find(
              (r) =>
                r.external.toLowerCase().includes(game.title.toLowerCase()) ||
                game.title.toLowerCase().includes(r.external.toLowerCase())
            );
          }
          
          // Take first result
          if (!bestMatch && searchResults.length > 0) {
            bestMatch = searchResults[0];
          }
        }
        
        let imageUrl = "";
        
        if (bestMatch && bestMatch.steamAppID) {
          imageUrl = `https://cdn.akamai.steamstatic.com/steam/apps/${bestMatch.steamAppID}/header.jpg`;
        } else if (bestMatch && bestMatch.thumb) {
          imageUrl = bestMatch.thumb;
        } else {
          // Try deals endpoint
          try {
            const dealUrl = `https://www.cheapshark.com/api/1.0/deals?title=${searchQuery}&pageSize=3`;
            const deals = await fetchJSON(dealUrl);
            
            if (deals.length > 0) {
              const deal = deals[0];
              if (deal.steamAppID) {
                imageUrl = `https://cdn.akamai.steamstatic.com/steam/apps/${deal.steamAppID}/header.jpg`;
              } else if (deal.thumb) {
                imageUrl = deal.thumb;
              }
            }
          } catch {}
        }
        
        if (imageUrl) {
          await client.query(
            "UPDATE games SET cover_image = $1, updated_at = NOW() WHERE id = $2",
            [imageUrl, game.id]
          );
          updated++;
          console.log(`✅ [${updated}/${allGames.length}] ${game.title} -> ${imageUrl.substring(0, 80)}`);
        } else {
          failed++;
          console.log(`❌ [${updated + failed}/${allGames.length}] ${game.title} -> NOT FOUND`);
        }
        
        // Rate limit
        await new Promise((resolve) => setTimeout(resolve, 350));
        
      } catch (err) {
        failed++;
        console.log(`⚠️  Error for ${game.title}: ${err.message}`);
      }
    }
    
    console.log(`\n=== DONE ===`);
    console.log(`Updated: ${updated}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total: ${allGames.length}`);
    
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
