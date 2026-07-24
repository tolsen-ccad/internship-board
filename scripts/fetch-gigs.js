const fs = require('fs');
const path = require('path');

const EXCLUDED_KEYWORDS = ["senior", "sr", "lead", "director", "manager", "full time", "full-time"];
const FREELANCE_TRACKS = {
  "3D Game Art": ["3d artist", "3d modeler", "modeling", "texturing", "texture", "environment artist", "prop", "asset"],
  "2D Game Art": ["2d artist", "concept artist", "illustrator", "ui artist", "sprite"],
  "Vehicle / Product Design": ["cad", "industrial design", "solidworks"]
};

function isSeniorOrFullTime(title) {
  const t = title.toLowerCase();
  return EXCLUDED_KEYWORDS.some(keyword => t.includes(keyword));
}

function determineGigType(title) {
  const t = title.toLowerCase();
  if (t.includes('freelance') || t.includes('freelancer')) return 'Freelance';
  if (t.includes('commission')) return 'Commission';
  return 'Contract';
}

function classifyTracks(title) {
  const t = title.toLowerCase();
  return Object.entries(FREELANCE_TRACKS)
    .filter(([, keywords]) => keywords.some(k => t.includes(k)))
    .map(([trackName]) => trackName);
}

async function fetchContractJobs() {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return [];

  // Query targeting freelance, contract, and short-term game art gigs
  const query = '"3d freelance" OR "game art contract" OR "3d asset commission" OR "short term 3d modeling" OR "2d concept contract"';
  const url = `https://serpapi.com/search.json?engine=google_jobs&q=${encodeURIComponent(query)}&api_key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (!data.jobs_results) return [];

    return data.jobs_results
      .filter(job => !isSeniorOrFullTime(job.title))
      .map(job => ({
        title: job.title,
        company: job.company_name,
        location: job.location || "Remote",
        url: job.related_links?.[0]?.link || job.apply_options?.[0]?.link || "https://www.google.com/search?q=" + encodeURIComponent(job.title),
        posted: new Date().toISOString().split('T')[0],
        tags: [determineGigType(job.title), ...classifyTracks(job.title)]
      }));
  } catch (error) {
    console.error("Error fetching gigs:", error);
    return [];
  }
}

async function updateGigBoard() {
  const newGigs = await fetchContractJobs();
  const gigsPath = path.join(__dirname, '../gigs.html');
  
  if (!fs.existsSync(gigsPath)) return;

  let html = fs.readFileSync(gigsPath, 'utf8');
  const regex = /manualListings:\s*\[([\s\S]*?)\]\s*,/;
  const match = html.match(regex);
  if (!match) return;

  // SAFE PARSING WRAPPER
  let existingGigs = [];
  try {
    existingGigs = new Function(`return [${match[1]}]`)();
  } catch (e) {
    console.error("Error parsing existing manual gigs within HTML source code:", e);
    return; // Stop execution smoothly to prevent workflow crashes
  }

  const combined = [...existingGigs];

  newGigs.forEach(gig => {
    if (!combined.some(g => g.url === gig.url)) combined.push(gig);
  });

  // Gigs move fast, keep active history to 45 days max
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 45);

  const activeGigs = combined.filter(g => new Date(g.posted) >= cutoff);
  const updatedHtml = html.replace(regex, `manualListings: ${JSON.stringify(activeGigs, null, 4)},`);
  
  fs.writeFileSync(gigsPath, updatedHtml, 'utf8');
  console.log(`Synced gigs.html. Total listings: ${activeGigs.length}`);
}

updateGigBoard();
