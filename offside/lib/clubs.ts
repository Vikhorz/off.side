// Club logos cache to prevent repeated API calls
const logoCache: Record<string, string> = {};

// TheSportsDB API base URL
const THE_SPORTS_DB_API = "https://www.thesportsdb.com/api/v1/json/3";

// Request timeout for logo fetching (in milliseconds)
const LOGO_REQUEST_TIMEOUT = 5000;

// Helper function to normalize team names for API search
function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\.\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Fallback logos for common teams (in case API fails)
const FALLBACK_LOGOS: Record<string, string> = {
  // Premier League
  "Arsenal": "https://www.thesportsdb.com/images/media/team/badge/xqpqup1490401846.png",
  "Aston Villa": "https://www.thesportsdb.com/images/media/team/badge/ouivpp1490401920.png",
  "Bournemouth": "https://www.thesportsdb.com/images/media/team/badge/pyynrp1490402058.png",
  "Brentford": "https://www.thesportsdb.com/images/media/team/badge/jjyvpp1490402359.png",
  "Brighton": "https://www.thesportsdb.com/images/media/team/badge/ox3duo1490402170.png",
  "Chelsea": "https://www.thesportsdb.com/images/media/team/badge/xx6q6o1490402285.png",
  "Crystal Palace": "https://www.thesportsdb.com/images/media/team/badge/yhgquu1490402576.png",
  "Everton": "https://www.thesportsdb.com/images/media/team/badge/kys3km1490402669.png",
  "Fulham": "https://www.thesportsdb.com/images/media/team/badge/iiigg71490402738.png",
  "Liverpool": "https://www.thesportsdb.com/images/media/team/badge/qdusuh1490402960.png",
  "Luton Town": "https://www.thesportsdb.com/images/media/team/badge/64yqup1593333587.png",
  "Manchester City": "https://www.thesportsdb.com/images/media/team/badge/uimj9o1490403089.png",
  "Manchester United": "https://www.thesportsdb.com/images/media/team/badge/tlummr1490403032.png",
  "Newcastle United": "https://www.thesportsdb.com/images/media/team/badge/qjnwqp1490403204.png",
  "Nottingham Forest": "https://www.thesportsdb.com/images/media/team/badge/uavbwm1490403397.png",
  "Sheffield United": "https://www.thesportsdb.com/images/media/team/badge/pp36qf1490403552.png",
  "Tottenham Hotspur": "https://www.thesportsdb.com/images/media/team/badge/1527yq1490403698.png",
  "West Ham United": "https://www.thesportsdb.com/images/media/team/badge/o6qums1490403801.png",
  "Wolverhampton Wanderers": "https://www.thesportsdb.com/images/media/team/badge/h38r9v1490403891.png",

  // La Liga
  "Alavés": "https://www.thesportsdb.com/images/media/team/badge/k33qt91482744244.png",
  "Athletic Bilbao": "https://www.thesportsdb.com/images/media/team/badge/15393y1482744318.png",
  "Atlético Madrid": "https://www.thesportsdb.com/images/media/team/badge/q8suoh1482744528.png",
  "Barcelona": "https://www.thesportsdb.com/images/media/team/badge/1348741482744842.png",
  "Betis": "https://www.thesportsdb.com/images/media/team/badge/rqju6i1482745033.png",
  "Cádiz": "https://www.thesportsdb.com/images/media/team/badge/94ypnx1557418089.png",
  "Celta Vigo": "https://www.thesportsdb.com/images/media/team/badge/66vadp1482745388.png",
  "Getafe": "https://www.thesportsdb.com/images/media/team/badge/1409221502638934.png",
  "Girona": "https://www.thesportsdb.com/images/media/team/badge/tmssru1482745694.png",
  "Granada": "https://www.thesportsdb.com/images/media/team/badge/jj6qua1482745899.png",
  "Las Palmas": "https://www.thesportsdb.com/images/media/team/badge/oiivso1482746178.png",
  "Mallorca": "https://www.thesportsdb.com/images/media/team/badge/d5hujm1482746260.png",
  "Osasuna": "https://www.thesportsdb.com/images/media/team/badge/qdrquu1482746372.png",
  "Rayo Vallecano": "https://www.thesportsdb.com/images/media/team/badge/7shgmf1482746466.png",
  "Real Madrid": "https://www.thesportsdb.com/images/media/team/badge/uopsne1482746859.png",
  "Real Sociedad": "https://www.thesportsdb.com/images/media/team/badge/1359771482747022.png",
  "Sevilla": "https://www.thesportsdb.com/images/media/team/badge/q4mjgm1482747233.png",
  "Valencia": "https://www.thesportsdb.com/images/media/team/badge/iiiggm1482747414.png",
  "Villarreal": "https://www.thesportsdb.com/images/media/team/badge/1348811482747600.png",

  // Bundesliga
  "Augsburg": "https://www.thesportsdb.com/images/media/team/badge/2ydssi1502639034.png",
  "Union Berlin": "https://www.thesportsdb.com/images/media/team/badge/1u6muw1534912945.png",
  "Werder Bremen": "https://www.thesportsdb.com/images/media/team/badge/1421651482747993.png",
  "Borussia Dortmund": "https://www.thesportsdb.com/images/media/team/badge/tp3qus1482748169.png",
  "Eintracht Frankfurt": "https://www.thesportsdb.com/images/media/team/badge/o4mwdu1482748483.png",
  "SC Freiburg": "https://www.thesportsdb.com/images/media/team/badge/1359821482748549.png",
  "Hamburger SV": "https://www.thesportsdb.com/images/media/team/badge/gm7gpd1482748700.png",
  "Hannover 96": "https://www.thesportsdb.com/images/media/team/badge/yiiqds1482748803.png",
  "Hertha BSC": "https://www.thesportsdb.com/images/media/team/badge/1360301482748931.png",
  "Bayer Leverkusen": "https://www.thesportsdb.com/images/media/team/badge/rwjdao1482749115.png",
  "Mainz 05": "https://www.thesportsdb.com/images/media/team/badge/1364791482749359.png",
  "Borussia Mönchengladbach": "https://www.thesportsdb.com/images/media/team/badge/1485901482749618.png",
  "Bayern Munich": "https://www.thesportsdb.com/images/media/team/badge/cDdxwy1482749826.png",
  "RB Leipzig": "https://www.thesportsdb.com/images/media/team/badge/1485641502639998.png",
  "FC St. Pauli": "https://www.thesportsdb.com/images/media/team/badge/0vvyux1561725958.png",
  "VfB Stuttgart": "https://www.thesportsdb.com/images/media/team/badge/r5gmnm1482750068.png",
  "VfL Wolfsburg": "https://www.thesportsdb.com/images/media/team/badge/1485891482750163.png",

  // Serie A
  "Atalanta": "https://www.thesportsdb.com/images/media/team/badge/1350371482750368.png",
  "Bologna": "https://www.thesportsdb.com/images/media/team/badge/1360461482750466.png",
  "Cagliari": "https://www.thesportsdb.com/images/media/team/badge/1360471482750592.png",
  "Como": "https://www.thesportsdb.com/images/media/team/badge/0slwgd1583195501.png",
  "Empoli": "https://www.thesportsdb.com/images/media/team/badge/1360501482750718.png",
  "Fiorentina": "https://www.thesportsdb.com/images/media/team/badge/1552921482750895.png",
  "Frosinone": "https://www.thesportsdb.com/images/media/team/badge/1568731482751121.png",
  "Genoa": "https://www.thesportsdb.com/images/media/team/badge/1364901482751276.png",
  "Inter Milan": "https://www.thesportsdb.com/images/media/team/badge/tmQuuG1482751333.png",
  "Juventus": "https://www.thesportsdb.com/images/media/team/badge/tb0mOf1482751458.png",
  "Lazio": "https://www.thesportsdb.com/images/media/team/badge/1360441482751695.png",
  "Lecce": "https://www.thesportsdb.com/images/media/team/badge/07cpyn1600057688.png",
  "AC Milan": "https://www.thesportsdb.com/images/media/team/badge/1566221482751832.png",
  "Monza": "https://www.thesportsdb.com/images/media/team/badge/1528791482751955.png",
  "Napoli": "https://www.thesportsdb.com/images/media/team/badge/1522961482752149.png",
  "Roma": "https://www.thesportsdb.com/images/media/team/badge/0ycbyg1482752277.png",
  "Salernitana": "https://www.thesportsdb.com/images/media/team/badge/1569181482752500.png",
  "Sassuolo": "https://www.thesportsdb.com/images/media/team/badge/1382151482752610.png",
  "Spezia": "https://www.thesportsdb.com/images/media/team/badge/0vvyux1561725958.png",
  "Torino": "https://www.thesportsdb.com/images/media/team/badge/1360531482752848.png",
  "Udinese": "https://www.thesportsdb.com/images/media/team/badge/1364841482752923.png",
  "Verona": "https://www.thesportsdb.com/images/media/team/badge/1485421482753152.png",

  // Ligue 1
  "Angers": "https://www.thesportsdb.com/images/media/team/badge/1365111482753303.png",
  "Auxerre": "https://www.thesportsdb.com/images/media/team/badge/1360551482753410.png",
  "Clermont": "https://www.thesportsdb.com/images/media/team/badge/1531241482753589.png",
  "Lille": "https://www.thesportsdb.com/images/media/team/badge/1360321482753699.png",
  "Lorient": "https://www.thesportsdb.com/images/media/team/badge/1365141482753808.png",
  "Lyon": "https://www.thesportsdb.com/images/media/team/badge/1360331482753921.png",
  "Marseille": "https://www.thesportsdb.com/images/media/team/badge/1360341482754012.png",
  "Metz": "https://www.thesportsdb.com/images/media/team/badge/1365171482754127.png",
  "Monaco": "https://www.thesportsdb.com/images/media/team/badge/1360361482754226.png",
  "Montpellier": "https://www.thesportsdb.com/images/media/team/badge/1360381482754335.png",
  "Nantes": "https://www.thesportsdb.com/images/media/team/badge/1360391482754435.png",
  "Nice": "https://www.thesportsdb.com/images/media/team/badge/1360401482754518.png",
  "Paris Saint-Germain": "https://www.thesportsdb.com/images/media/team/badge/1359341482754651.png",
  "Reims": "https://www.thesportsdb.com/images/media/team/badge/1360411482754747.png",
  "Rennes": "https://www.thesportsdb.com/images/media/team/badge/1360421482754845.png",
  "Saint-Étienne": "https://www.thesportsdb.com/images/media/team/badge/1360431482754945.png",
  "Strasbourg": "https://www.thesportsdb.com/images/media/team/badge/1360451482755051.png",
  "Toulouse": "https://www.thesportsdb.com/images/media/team/badge/1360471482755150.png",

  // Default fallback
  "default": "https://www.thesportsdb.com/images/media/team/badge/default.png"
};

// Function to fetch club logo from TheSportsDB API with timeout
export async function fetchClubLogo(clubName: string): Promise<string> {
  // Check cache first
  if (logoCache[clubName]) {
    return logoCache[clubName];
  }

  // Check fallback first for faster response
  if (FALLBACK_LOGOS[clubName]) {
    logoCache[clubName] = FALLBACK_LOGOS[clubName];
    return FALLBACK_LOGOS[clubName];
  }

  // Create a timeout promise
  const timeoutPromise = new Promise<Response>((_, reject) =>
    setTimeout(() => reject(new Error('Logo request timeout')), LOGO_REQUEST_TIMEOUT)
  );

  try {
    const normalizedName = normalizeTeamName(clubName);

    // Race the fetch against timeout
    const response = await Promise.race([
      fetch(`${THE_SPORTS_DB_API}/searchteams.php?t=${encodeURIComponent(normalizedName)}`),
      timeoutPromise
    ]) as Response;

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (data.teams && data.teams.length > 0 && data.teams[0].strTeamBadge) {
      const logoUrl = data.teams[0].strTeamBadge;
      logoCache[clubName] = logoUrl;
      return logoUrl;
    }

    // If no team found, try a broader search with timeout
    const searchResponse = await Promise.race([
      fetch(`${THE_SPORTS_DB_API}/searchteams.php?t=${encodeURIComponent(clubName)}`),
      timeoutPromise
    ]) as Response;

    if (!searchResponse.ok) {
      throw new Error(`Search API request failed with status ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();

    if (searchData.teams && searchData.teams.length > 0 && searchData.teams[0].strTeamBadge) {
      const logoUrl = searchData.teams[0].strTeamBadge;
      logoCache[clubName] = logoUrl;
      return logoUrl;
    }

    // If still no result, use fallback or default
    const fallback = FALLBACK_LOGOS[clubName] ?? FALLBACK_LOGOS.default;
    logoCache[clubName] = fallback;
    return fallback;
  } catch (error) {
    console.warn(`Failed to fetch logo for ${clubName}:`, error);
    // Return fallback or default
    const fallback = FALLBACK_LOGOS[clubName] ?? FALLBACK_LOGOS.default;
    logoCache[clubName] = fallback;
    return fallback;
  }
}

// Synchronous wrapper for use in React components
export function getClubLogo(clubName: string): string {
  // Return cached version if available
  if (logoCache[clubName]) {
    return logoCache[clubName];
  }

  // Return fallback immediately for better UX
  return FALLBACK_LOGOS[clubName] ?? FALLBACK_LOGOS.default;
}

// Async version for when you need to fetch the actual logo
export async function getClubLogoAsync(clubName: string): Promise<string> {
  return await fetchClubLogo(clubName);
}