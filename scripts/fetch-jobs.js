const fs = require('fs');
const path = require('path');

async function fetchGoogleJobs() {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    console.log("No SerpApi key found, skipping automated external fetch.");
    return [];
  }

  // Example query targeting game art/design internships
  const query = "game art intern OR design internship";
  const url = `https://serpapi.com/search.json?engine=google_jobs&q=${encodeURIComponent(query)}&api_key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.jobs_results) return [];

    return data.jobs_results.map(job => ({
      title: job.title,
      company: job.company_name,
      location: job.location || "Remote",
      url: job.related_links?.[0]?.link || job.apply_options?.[0]?.link || "https://www.google.com/search?q=" + encodeURIComponent(job.title),
      posted: new Date().toISOString().split('T')[0], // Today's date stamp
      tags: ["Internship", "3D Game Art"] // Auto-categorized or rule-parsed
    }));
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return [];
  }
}

async function updateBoard() {
  const htmlPath = path.join(__dirname, '../index.html');
  let htmlContent = fs.readFileSync(htmlPath, 'utf8');

  const newJobs = await fetchGoogleJobs();
  if (newJobs.length === 0) return;

  // For demonstration: parse existing manualListings block inside index.html 
  // or write a dedicated JSON data file that index.html fetches dynamically.
  console.log(`Fetched ${newJobs.length} new jobs to integrate.`);
}

updateBoard();