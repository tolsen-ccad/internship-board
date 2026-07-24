const fs = require('fs');
const path = require('path');

// Keywords that must NOT be present in the title
const EXCLUDED_KEYWORDS = [
  "senior", "sr", "lead", "director", "manager", 
  "principal", "staff", "head of", "chief", "expert", "experienced"
];

function isSeniorOrManagement(title) {
  const t = title.toLowerCase();
  return EXCLUDED_KEYWORDS.some(keyword => t.includes(keyword));
}

async function fetchGoogleJobs() {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    console.log("No SerpApi key found, skipping automated external fetch.");
    return [];
  }

  const query = "game art intern OR design internship";
  const url = `https://serpapi.com/search.json?engine=google_jobs&q=${encodeURIComponent(query)}&api_key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.jobs_results) return [];

    // Filter out any roles containing senior/management terms
    const filteredJobs = data.jobs_results.filter(job => !isSeniorOrManagement(job.title));

    return filteredJobs.map(job => ({
      title: job.title,
      company: job.company_name,
      location: job.location || "Remote",
      url: job.related_links?.[0]?.link || job.apply_options?.[0]?.link || "https://www.google.com/search?q=" + encodeURIComponent(job.title),
      posted: new Date().toISOString().split('T')[0],
      tags: ["Internship", "3D Game Art"]
    }));
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return [];
  }
}

async function updateBoard() {
  const newJobs = await fetchGoogleJobs();
  if (newJobs.length === 0) {
    console.log("No new jobs found or processed.");
    return;
  }

  console.log(`Successfully fetched and filtered ${newJobs.length} non-senior listings.`);
}

updateBoard();
