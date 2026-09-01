// Club logos cache to prevent repeated API calls with expiration
interface LogoCacheEntry {
  url: string;
  timestamp: number;
}

const logoCache: Record<string, LogoCacheEntry> = {};
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// TheSportsDB API base URL
const THE_SPORTS_DB_API = "https://www.thesportsdb.com/api/v1/json/3";

// Request timeout for logo fetching (in milliseconds)
const LOGO_REQUEST_TIMEOUT = 5000;

// Helper function to normalize team names for API search
function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, " ") // Replace special characters with space
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
}

// football-data.org's stable team IDs. These crest URLs do not depend on a
// third-party name search and are the primary source for clubs in our fixtures.
// Include the common API naming variants because football-data occasionally
// appends "FC" or uses a shortened display name.
const FOOTBALL_DATA_TEAM_IDS: Record<string, number> = {
  "arsenal": 57, "arsenal fc": 57,
  "aston villa": 58, "aston villa fc": 58,
  "bournemouth": 1044, "afc bournemouth": 1044,
  "brentford": 402, "brentford fc": 402,
  "brighton": 397, "brighton and hove albion": 397,
  "chelsea": 61, "chelsea fc": 61,
  "crystal palace": 354, "crystal palace fc": 354,
  "everton": 62, "everton fc": 62,
  "fulham": 63, "fulham fc": 63,
  "liverpool": 64, "liverpool fc": 64,
  "luton town": 72, "luton town fc": 72,
  "manchester city": 65, "manchester city fc": 65,
  "manchester united": 66, "manchester united fc": 66,
  "newcastle united": 67, "newcastle united fc": 67,
  "nottingham forest": 351, "nottingham forest fc": 351,
  "sheffield united": 356, "sheffield united fc": 356,
  "tottenham hotspur": 73, "tottenham hotspur fc": 73,
  "west ham united": 563, "west ham united fc": 563,
  "wolverhampton wanderers": 76, "wolverhampton wanderers fc": 76,
  "wolves": 76,
  // La Liga
  "alaves": 263, "deportivo alaves": 263,
  "athletic bilbao": 77, "athletic club": 77,
  "atletico madrid": 78, "atletico de madrid": 78,
  "barcelona": 81, "fc barcelona": 81,
  "betis": 90, "real betis": 90,
  "celta vigo": 558, "rc celta": 558,
  "espanyol": 80, "rcd espanyol": 80,
  "getafe": 82, "getafe cf": 82,
  "girona": 298, "girona fc": 298,
  "las palmas": 275, "ud las palmas": 275,
  "mallorca": 89, "rcd mallorca": 89,
  "osasuna": 79, "ca osasuna": 79,
  "rayo vallecano": 88, "rayo vallecano de madrid": 88,
  "real madrid": 86, "real madrid cf": 86,
  "real sociedad": 92, "real sociedad de futbol": 92,
  "sevilla": 559, "sevilla fc": 559,
  "valencia": 95, "valencia cf": 95,
  "villarreal": 94, "villarreal cf": 94,
  // Bundesliga
  "augsburg": 16, "fc augsburg": 16,
  "union berlin": 28, "1 fc union berlin": 28,
  "werder bremen": 12, "sv werder bremen": 12,
  "borussia dortmund": 4, "dortmund": 4,
  "eintracht frankfurt": 19,
  "sc freiburg": 17, "freiburg": 17,
  "hamburger sv": 7, "hamburg": 7,
  "hannover 96": 8, "hannover": 8,
  "hertha bsc": 9, "hertha berlin": 9,
  "bayer leverkusen": 3, "leverkusen": 3,
  "mainz 05": 15, "mainz": 15,
  "borussia monchengladbach": 18, "monchengladbach": 18,
  "bayern munich": 5, "bayern munchen": 5, "fc bayern munich": 5,
  "rb leipzig": 721, "rasenballsport leipzig": 721,
  "fc st pauli": 20, "st pauli": 20,
  "vfb stuttgart": 10, "stuttgart": 10,
  "vfl wolfsburg": 11, "wolfsburg": 11,
  // Serie A
  "atalanta": 102, "atalanta bc": 102,
  "bologna": 103, "bologna fc": 103,
  "cagliari": 104, "cagliari calcio": 104,
  "empoli": 445, "empoli fc": 445,
  "fiorentina": 99, "acf fiorentina": 99,
  "frosinone": 97, "frosinone calcio": 97,
  "genoa": 107, "genoa cfc": 107,
  "inter milan": 108, "internazionale": 108, "inter": 108,
  "juventus": 109, "juventus fc": 109,
  "lazio": 110, "ss lazio": 110,
  "lecce": 5890, "us lecce": 5890,
  "ac milan": 98, "milan": 98,
  "monza": 5911, "ac monza": 5911,
  "napoli": 113, "ssc napoli": 113,
  "roma": 100, "as roma": 100,
  "salernitana": 455, "us salernitana": 455,
  "sassuolo": 471, "us sassuolo": 471,
  "spezia": 488, "speziа": 488,
  "torino": 586, "torino fc": 586,
  "udinese": 115, "udinese calcio": 115,
  "verona": 450, "hellas verona": 450,
  // Ligue 1
  "angers": 532, "angers sco": 532,
  "auxerre": 519, "aj auxerre": 519,
  "clermont": 538, "clermont foot": 538,
  "lille": 521, "losc lille": 521,
  "lorient": 525, "fc lorient": 525,
  "lyon": 523, "olympique lyon": 523,
  "marseille": 516, "olympique marseille": 516,
  "metz": 545, "fc metz": 545,
  "monaco": 548, "as monaco": 548,
  "montpellier": 518, "montpellier hsc": 518,
  "nantes": 543, "fc nantes": 543,
  "nice": 522, "ogc nice": 522,
  "paris saint germain": 524, "paris sg": 524, "psg": 524,
  "reims": 547, "stade de reims": 547,
  "rennes": 529, "stade rennais": 529,
  "saint etienne": 527, "as saint etienne": 527,
  "strasbourg": 576, "rc strasbourg alsace": 576,
  "toulouse": 511, "toulouse fc": 511,
};

function getFootballDataLogo(clubName: string): string | null {
  const normalizedName = normalizeTeamName(clubName);
  const withoutClubSuffix = normalizedName.replace(/\s+(?:fc|cf|afc)$/i, "");
  const teamId = FOOTBALL_DATA_TEAM_IDS[normalizedName] ?? FOOTBALL_DATA_TEAM_IDS[withoutClubSuffix];
  return teamId ? `https://crests.football-data.org/${teamId}.png` : null;
}

// Fallback logos for common teams (in case API fails)
const FALLBACK_LOGOS: Record<string, string> = {
  // Premier League
  "Arsenal": "https://www.thesportsdb.com/images/media/team/badge/xqpqup1490401846.png",
  "Aston Villa": "https://www.thesportsdb.com/images/media/team-badge/ouivpp1490401920.png",
  "Bournemouth": "https://www.thesportsdb.com/images/media/team-badge/pyynrp1490402058.png",
  "Brentford": "https://www.thesportsdb.com/images/media/team-badge/jjyvpp1490402359.png",
  "Brighton": "https://www.thesportsdb.com/images/media/team-badge/ox3duo1490402170.png",
  "Chelsea": "https://www.thesportsdb.com/images/media/team-badge/xx6q6o1490402285.png",
  "Crystal Palace": "https://www.thesportsdb.com/images/media/team-badge/yhgquu1490402576.png",
  "Everton": "https://www.thesportsdb.com/images/media/team-badge/kys3km1490402669.png",
  "Fulham": "https://www.thesportsdb.com/images/media/team-badge/iiigg71490402738.png",
  "Liverpool": "https://www.thesportsdb.com/images/media/team-badge/qdusuh1490402960.png",
  "Luton Town": "https://www.thesportsdb.com/images/media/team-badge/64yqup1593333587.png",
  "Manchester City": "https://www.thesportsdb.com/images/media/team-badge/uimj9o1490403089.png",
  "Manchester United": "https://www.thesportsdb.com/images/media/team-badge/tlummr1490403032.png",
  "Newcastle United": "https://www.thesportsdb.com/images/media/team-badge/qjnwqp1490403204.png",
  "Nottingham Forest": "https://www.thesportsdb.com/images/media/team-badge/uavbwm1490403397.png",
  "Sheffield United": "https://www.thesportsdb.com/images/media/team-badge/pp36qf1490403552.png",
  "Tottenham Hotspur": "https://www.thesportsdb.com/images/media/team-badge/1527yq1490403698.png",
  "West Ham United": "https://www.thesportsdb.com/images/media/team-badge/o6qums1490403801.png",
  "Wolverhampton Wanderers": "https://www.thesportsdb.com/images/media/team-badge/h38r9v1490403891.png",

  // La Liga
  "Alavés": "https://www.thesportsdb.com/images/media/team-badge/k33qt91482744244.png",
  "Athletic Bilbao": "https://www.thesportsdb.com/images/media/team-badge/15393y1482744318.png",
  "Atlético Madrid": "https://www.thesportsdb.com/images/media/team-badge/q8suoh1482744528.png",
  "Barcelona": "https://www.thesportsdb.com/images/media/team-badge/1348741482744842.png",
  "Betis": "https://www.thesportsdb.com/images/media/team-badge/rqju6i1482745033.png",
  "Cádiz": "https://www.thesportsdb.com/images/media/team-badge/94ypnx1557418089.png",
  "Celta Vigo": "https://www.thesportsdb.com/images/media/team-badge/66vadp1482745388.png",
  "Getafe": "https://www.thesportsdb.com/images/media/team-badge/1409221502638934.png",
  "Girona": "https://www.thesportsdb.com/images/media/team-badge/tmssru1482745694.png",
  "Granada": "https://www.thesportsdb.com/images/media/team-badge/jj6qua1482745899.png",
  "Las Palmas": "https://www.thesportsdb.com/images/media/team-badge/oiivso1482746178.png",
  "Mallorca": "https://www.thesportsdb.com/images/media/team-badge/d5hujm1482746260.png",
  "Osasuna": "https://www.thesportsdb.com/images/media/team-badge/qdrquu1482746372.png",
  "Rayo Vallecano": "https://www.thesportsdb.com/images/media/team-badge/7shgmf1482746466.png",
  "Real Madrid": "https://www.thesportsdb.com/images/media/team-badge/uopsne1482746859.png",
  "Real Sociedad": "https://www.thesportsdb.com/images/media/team-badge/1359771482747022.png",
  "Sevilla": "https://www.thesportsdb.com/images/media/team-badge/q4mjgm1482747233.png",
  "Valencia": "https://www.thesportsdb.com/images/media/team-badge/iiiggm1482747414.png",
  "Villarreal": "https://www.thesportsdb.com/images/media/team-badge/1348811482747600.png",

  // Bundesliga
  "Augsburg": "https://www.thesportsdb.com/images/media/team-badge/2ydssi1502639034.png",
  "Union Berlin": "https://www.thesportsdb.com/images/media/team-badge/1u6muw1534912945.png",
  "Werder Bremen": "https://www.thesportsdb.com/images/media/team-badge/1421651482747993.png",
  "Borussia Dortmund": "https://www.thesportsdb.com/images/media/team-badge/tp3qus1482748169.png",
  "Eintracht Frankfurt": "https://www.thesportsdb.com/images/media/team-badge/o4mwdu1482748483.png",
  "SC Freiburg": "https://www.thesportsdb.com/images/media/team-badge/1359821482748549.png",
  "Hamburger SV": "https://www.thesportsdb.com/images/media/team-badge/gm7gpd1482748700.png",
  "Hannover 96": "https://www.thesportsdb.com/images/media/team-badge/yiiqds1482748803.png",
  "Hertha BSC": "https://www.thesportsdb.com/images/media/team-badge/1360301482748931.png",
  "Bayer Leverkusen": "https://www.thesportsdb.com/images/media/team-badge/rwjdao1482749115.png",
  "Mainz 05": "https://www.thesportsdb.com/images/media/team-badge/1364791482749359.png",
  "Borussia Mönchengladbach": "https://www.thesportsdb.com/images/media/team-badge/1485901482749618.png",
  "Bayern Munich": "https://www.thesportsdb.com/images/media/team-badge/cDdxwy1482749826.png",
  "RB Leipzig": "https://www.thesportsdb.com/images/media/team-badge/1485641502639998.png",
  "FC St. Pauli": "https://www.thesportsdb.com/images/media/team-badge/0vvyux1561725958.png",
  "VfB Stuttgart": "https://www.thesportsdb.com/images/media/team-badge/r5gmnm1482750068.png",
  "VfL Wolfsburg": "https://www.thesportsdb.com/images/media/team-badge/1485891482750163.png",

  // Serie A
  "Atalanta": "https://www.thesportsdb.com/images/media/team-badge/1350371482750368.png",
  "Bologna": "https://www.thesportsdb.com/images/media/team-badge/1360461482750466.png",
  "Cagliari": "https://www.thesportsdb.com/images/media/team-badge/1360471482750592.png",
  "Como": "https://www.thesportsdb.com/images/media/team-badge/0slwgd1583195501.png",
  "Empoli": "https://www.thesportsdb.com/images/media/team-badge/1360501482750718.png",
  "Fiorentina": "https://www.thesportsdb.com/images/media/team-badge/1552921482750895.png",
  "Frosinone": "https://www.thesportsdb.com/images/media/team-badge/1568731482751121.png",
  "Genoa": "https://www.thesportsdb.com/images/media/team-badge/1364901482751276.png",
  "Inter Milan": "https://www.thesportsdb.com/images/media/team-badge/tmQuuG1482751333.png",
  "Juventus": "https://www.thesportsdb.com/images/media/team-badge/tb0mOf1482751458.png",
  "Lazio": "https://www.thesportsdb.com/images/media/team-badge/1360441482751695.png",
  "Lecce": "https://www.thesportsdb.com/images/media/team-badge/07cpyn1600057688.png",
  "AC Milan": "https://www.thesportsdb.com/images/media/team-badge/1566221482751832.png",
  "Monza": "https://www.thesportsdb.com/images/media/team-badge/1528791482751955.png",
  "Napoli": "https://www.thesportsdb.com/images/media/team-badge/1522961482752149.png",
  "Roma": "https://www.thesportsdb.com/images/media/team-badge/0ycbyg1482752277.png",
  "Salernitana": "https://www.thesportsdb.com/images/media/team-badge/1569181482752500.png",
  "Sassuolo": "https://www.thesportsdb.com/images/media/team-badge/1382151482752610.png",
  "Spezia": "https://www.thesportsdb.com/images/media/team-badge/0vvyux1561725958.png",
  "Torino": "https://www.thesportsdb.com/images/media/team-badge/1360531482752848.png",
  "Udinese": "https://www.thesportsdb.com/images/media/team-badge/1364841482752923.png",
  "Verona": "https://www.thesportsdb.com/images/media/team-badge/1485421482753152.png",

  // Ligue 1
  "Angers": "https://www.thesportsdb.com/images/media/team-badge/1365111482753303.png",
  "Auxerre": "https://www.thesportsdb.com/images/media/team-badge/1360551482753410.png",
  "Clermont": "https://www.thesportsdb.com/images/media/team-badge/1531241482753589.png",
  "Lille": "https://www.thesportsdb.com/images/media/team-badge/1360321482753699.png",
  "Lorient": "https://www.thesportsdb.com/images/media/team-badge/1365141482753808.png",
  "Lyon": "https://www.thesportsdb.com/images/media/team-badge/1360331482753921.png",
  "Marseille": "https://www.thesportsdb.com/images/media/team-badge/1360341482754012.png",
  "Metz": "https://www.thesportsdb.com/images/media/team-badge/1365171482754127.png",
  "Monaco": "https://www.thesportsdb.com/images/media/team-badge/1360361482754226.png",
  "Montpellier": "https://www.thesportsdb.com/images/media/team-badge/1360381482754335.png",
  "Nantes": "https://www.thesportsdb.com/images/media/team-badge/1360391482754435.png",
  "Nice": "https://www.thesportsdb.com/images/media/team-badge/1360401482754518.png",
  "Paris Saint-Germain": "https://www.thesportsdb.com/images/media/team-badge/1359341482754651.png",
  "Reims": "https://www.thesportsdb.com/images/media/team-badge/1360411482754747.png",
  "Rennes": "https://www.thesportsdb.com/images/media/team-badge/1360421482754845.png",
  "Saint-Étienne": "https://www.thesportsdb.com/images/media/team-badge/1360431482754945.png",
  "Strasbourg": "https://www.thesportsdb.com/images/media/team-badge/1360451482755051.png",
  "Toulouse": "https://www.thesportsdb.com/images/media/team-badge/1360471482755150.png",

  // Default fallback
  "default": "/logos/club-fallback.svg"
};

// Helper function to fetch with timeout
async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LOGO_REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

// Function to fetch club logo from TheSportsDB API with timeout and cache expiration
export async function fetchClubLogo(clubName: string): Promise<string> {
  // Check cache first with expiration
  const cached = logoCache[clubName];
  if (cached && (Date.now() - cached.timestamp < CACHE_EXPIRY_MS)) {
    return cached.url;
  }

  const footballDataLogo = getFootballDataLogo(clubName);
  if (footballDataLogo) {
    logoCache[clubName] = { url: footballDataLogo, timestamp: Date.now() };
    return footballDataLogo;
  }

  // Check fallback first for faster response
  if (FALLBACK_LOGOS[clubName]) {
    logoCache[clubName] = {
      url: FALLBACK_LOGOS[clubName],
      timestamp: Date.now()
    };
    return FALLBACK_LOGOS[clubName];
  }

  try {
    const normalizedName = normalizeTeamName(clubName);

    // First attempt: search with normalized name
    let response = await fetchWithTimeout(
      `${THE_SPORTS_DB_API}/searchteams.php?t=${encodeURIComponent(normalizedName)}`
    );

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (data.teams && data.teams.length > 0 && data.teams[0].strTeamBadge) {
      const logoUrl = data.teams[0].strTeamBadge;
      logoCache[clubName] = {
        url: logoUrl,
        timestamp: Date.now()
      };
      return logoUrl;
    }

    // Second attempt: search with original name (if normalized didn't work)
    response = await fetchWithTimeout(
      `${THE_SPORTS_DB_API}/searchteams.php?t=${encodeURIComponent(clubName)}`
    );

    if (!response.ok) {
      throw new Error(`Search API request failed with status ${response.status}`);
    }

    const searchData = await response.json();

    if (searchData.teams && searchData.teams.length > 0 && searchData.teams[0].strTeamBadge) {
      const logoUrl = searchData.teams[0].strTeamBadge;
      logoCache[clubName] = {
        url: logoUrl,
        timestamp: Date.now()
      };
      return logoUrl;
    }

    // If still no result, use fallback or default
    const fallback = FALLBACK_LOGOS[clubName] ?? FALLBACK_LOGOS.default;
    logoCache[clubName] = {
      url: fallback,
      timestamp: Date.now()
    };
    return fallback;
  } catch (error) {
    console.warn(`Failed to fetch logo for ${clubName}:`, error);
    // Return fallback or default
    const fallback = FALLBACK_LOGOS[clubName] ?? FALLBACK_LOGOS.default;
    logoCache[clubName] = {
      url: fallback,
      timestamp: Date.now()
    };
    return fallback;
  }
}

// Synchronous wrapper for use in React components
export function getClubLogo(clubName: string): string {
  // Check cache first with expiration
  const cached = logoCache[clubName];
  if (cached && (Date.now() - cached.timestamp < CACHE_EXPIRY_MS)) {
    return cached.url;
  }

  const footballDataLogo = getFootballDataLogo(clubName);
  if (footballDataLogo) return footballDataLogo;

  // Return fallback immediately for better UX
  return FALLBACK_LOGOS[clubName] ?? FALLBACK_LOGOS.default;
}

// Async version for when you need to fetch the actual logo
export async function getClubLogoAsync(clubName: string): Promise<string> {
  return await fetchClubLogo(clubName);
}

// Function to clear cache (useful for testing or manual cache invalidation)
export function clearLogoCache(): void {
  Object.keys(logoCache).forEach(key => {
    delete logoCache[key];
  });
}

// Function to get cache stats (useful for debugging)
export function getLogoCacheStats(): { size: number; expired: number } {
  const now = Date.now();
  let size = 0;
  let expired = 0;

  for (const key in logoCache) {
    size++;
    if (now - logoCache[key].timestamp >= CACHE_EXPIRY_MS) {
      expired++;
    }
  }

  return { size, expired };
}
