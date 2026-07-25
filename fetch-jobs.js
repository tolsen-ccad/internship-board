const fs = require('fs');

// Helper to scan text and safely inject the Remote tag
function applyRemoteTag(tags, location, title) {
  const combinedText = `${location} ${title}`.toLowerCase();
  const cleanTags = [...new Set(tags)];
  
  if (combinedText.includes('remote') || combinedText.includes('wfh') || combinedText.includes('anywhere')) {
    if (!cleanTags.includes('Remote')) {
      cleanTags.push('Remote');
    }
  }
  return cleanTags;
}

const MANUAL_JOBS = [
  {
    title: "Junior Technical Artist",
    company: "Believer Games",
    location: "Los Angeles, CA (Hybrid)",
    url: "https://www.believer.gg/careers",
    posted: new Date().toISOString(),
    tags: ["Full-Time", "Technical Art"]
  },
  {
    title: "Associate Concept Artist",
    company: "海外 Indie Studio",
    location: "Remote (US Friendly)",
    url: "https://example.com/careers",
    posted: new Date().toISOString(),
    tags: ["Internship", "2D Art"]
  }
];

async function fetchGreenhouse() {
  try {
    const res = await fetch('https://boards-api.greenhouse.io/v1/boards/your_board_token/jobs');
    if (!res.ok) return [];
    const data = await res.json();
    
    return data.jobs.map(j => {
      const loc = j.location?.name || "Remote / US";
      return {
        title: j.title,
        company: "Greenhouse Partner",
        location: loc,
        url: j.absolute_url,
        posted: j.updated_at,
        tags: applyRemoteTag(["Greenhouse", "Entry-Level"], loc, j.title)
      };
    });
  } catch (e) {
    console.error("Error fetching Greenhouse:", e);
    return [];
  }
}

async function fetchLever() {
  try {
    const res = await fetch('https://api.lever.co/v0/postings/your_lever_token?mode=json');
    if (!res.ok) return [];
    const data = await res.json();
    
    return data.map(j => {
      const loc = j.categories?.location || "US Nationwide";
      return {
        title: j.title,
        company: "Lever Partner",
        location: loc,
        url: j.hostedUrl,
        posted: new Date(j.createdAt).toISOString(),
        tags: applyRemoteTag(["Lever", "Internship"], loc, j.title)
      };
    });
  } catch (e) {
    console.error("Error fetching Lever:", e);
    return [];
  }
}

async function main() {
  console.log("Starting Server-Side Job Aggregate with Auto-Remote Processing...");
  const greenhouseJobs = await fetchGreenhouse();
  const leverJobs = await fetchLever();
  
  // Clean manual listings through the parser as well
  const processedManual = MANUAL_JOBS.map(j => ({
    ...j,
    tags: applyRemoteTag(j.tags, j.location, j.title)
  }));
  
  const allJobs = [...processedManual, ...greenhouseJobs, ...leverJobs];
  
  fs.writeFileSync('jobs.json', JSON.stringify(allJobs, null, 2));
  console.log(`Successfully generated jobs.json with ${allJobs.length} items.`);
}

main();