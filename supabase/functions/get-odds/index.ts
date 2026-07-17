import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// The Odds API base URL
const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';

// Mapeamento de esportes
const SPORT_KEYS: Record<string, string> = {
  'soccer': 'soccer',
  'basketball': 'basketball_nba',
  'american_football': 'americanfootball_nfl',
  'tennis': 'tennis_atp',
  'mma': 'mma_mma',
  'boxing': 'boxing_boxing',
  'baseball': 'baseball_mlb',
  'ice_hockey': 'icehockey_nhl',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { sport = 'soccer', regions = ['us', 'uk', 'eu'], markets = ['h2h'] } = await req.json();

    const apiKey = Deno.env.get('ODDS_API_KEY');
    
    if (!apiKey) {
      // Retornar dados mock se não tiver API key
      console.log('⚠️ ODDS_API_KEY não configurada, retornando dados mock');
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: getMockOdds(sport),
          source: 'mock' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sportKey = SPORT_KEYS[sport] || sport;
    
    const params = new URLSearchParams({
      apiKey,
      regions: regions.join(','),
      markets: markets.join(','),
      oddsFormat: 'decimal'
    });

    console.log(`📊 [GET-ODDS] Buscando odds para ${sportKey}...`);

    const response = await fetch(
      `${ODDS_API_BASE}/sports/${sportKey}/odds?${params}`
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ [GET-ODDS] Erro da API:', error);
      
      // Fallback para mock em caso de erro
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: getMockOdds(sport),
          source: 'mock_fallback',
          error: `API error: ${response.status}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const creditsUsed = response.headers.get('X-API-Credits-Used') || '0';

    console.log(`✅ [GET-ODDS] Credits usados: ${creditsUsed}`);

    // Mapear dados
    const mappedData = mapOddsResponse(data, sport);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: mappedData,
        creditsUsed: parseInt(creditsUsed),
        source: 'api'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('💥 [GET-ODDS] Erro:', err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function mapOddsResponse(data: any[], sport: string): any[] {
  return data.map((event: any) => {
    const bookmaker = event.bookmakers?.[0];
    const h2h = bookmaker?.markets?.find((m: any) => m.key === 'h2h');
    
    const homeOutcome = h2h?.outcomes?.find((o: any) => 
      o.name === event.home_team || o.name === 'Home'
    );
    const drawOutcome = h2h?.outcomes?.find((o: any) => 
      o.name === 'Draw'
    );
    const awayOutcome = h2h?.outcomes?.find((o: any) => 
      o.name === event.away_team || o.name === 'Away'
    );

    return {
      id: event.id,
      sport: event.sport_key,
      league: event.sport_title,
      homeTeam: event.home_team,
      awayTeam: event.away_team,
      startTime: new Date(event.commence_time).getTime(),
      homeOdds: homeOutcome?.price || 0,
      drawOdds: drawOutcome?.price || 0,
      awayOdds: awayOutcome?.price || 0,
      bookmaker: bookmaker?.title || 'Unknown',
      lastUpdate: Date.now(),
    };
  }).filter((o) => o.homeOdds > 0);
}

function getMockOdds(sport: string): any[] {
  const now = Date.now();
  const hour = 3600000;

  const mockData: Record<string, any[]> = {
    soccer: [
      {
        id: '1',
        sport: 'soccer',
        league: 'Brasileirão Série A',
        homeTeam: 'Flamengo',
        awayTeam: 'Palmeiras',
        startTime: now + hour * 2,
        homeOdds: 2.15,
        drawOdds: 3.40,
        awayOdds: 3.20,
        bookmaker: 'Bet365',
        lastUpdate: now,
      },
      {
        id: '2',
        sport: 'soccer',
        league: 'Premier League',
        homeTeam: 'Arsenal',
        awayTeam: 'Liverpool',
        startTime: now + hour * 4,
        homeOdds: 2.60,
        drawOdds: 3.50,
        awayOdds: 2.50,
        bookmaker: 'Betano',
        lastUpdate: now,
      },
      {
        id: '3',
        sport: 'soccer',
        league: 'La Liga',
        homeTeam: 'Real Madrid',
        awayTeam: 'Barcelona',
        startTime: now + hour * 6,
        homeOdds: 2.20,
        drawOdds: 3.60,
        awayOdds: 2.90,
        bookmaker: 'Bet365',
        lastUpdate: now,
      },
      {
        id: '4',
        sport: 'soccer',
        league: 'Brasileirão Série A',
        homeTeam: 'Corinthians',
        awayTeam: 'São Paulo',
        startTime: now + hour * 8,
        homeOdds: 2.80,
        drawOdds: 3.20,
        awayOdds: 2.50,
        bookmaker: 'Betano',
        lastUpdate: now,
      },
    ],
    basketball: [
      {
        id: '5',
        sport: 'basketball',
        league: 'NBA',
        homeTeam: 'Lakers',
        awayTeam: 'Celtics',
        startTime: now + hour * 3,
        homeOdds: 1.85,
        drawOdds: 0,
        awayOdds: 1.95,
        bookmaker: 'Stake',
        lastUpdate: now,
      },
    ],
    tennis: [
      {
        id: '6',
        sport: 'tennis',
        league: 'ATP',
        homeTeam: 'Nadal',
        awayTeam: 'Djokovic',
        startTime: now + hour * 5,
        homeOdds: 2.80,
        drawOdds: 0,
        awayOdds: 1.50,
        bookmaker: 'Bet365',
        lastUpdate: now,
      },
    ],
  };

  return mockData[sport] || mockData.soccer;
}
