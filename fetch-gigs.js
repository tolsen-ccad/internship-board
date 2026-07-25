const fs = require('fs');

function applyRemoteTag(tags, locationOrSource, title) {
  const combinedText = `${locationOrSource} ${title}`.toLowerCase();
  const cleanTags = [...new Set(tags)];
  
  if (combinedText.includes('remote') || combinedText.includes('wfh') || combinedText.includes('discord') || combinedText.includes('online')) {
    if (!cleanTags.includes('Remote')) {
      cleanTags.push('Remote');
    }
  }
  return cleanTags;
}

const MANUAL_GIGS = [
  {
    title: "UI Pixel Artist (Short-Term Contract)",
    client: "Indie Studio Delta",
    budget: "$2,500 Milestone",
    url: "https://discord.gg/example",
    source: "Discord Jobs",
    tags: ["Contract", "2D Art"]
  },
  {
    title: "3D Prop Modeler",
    client: "Tokyo Game Collective",
    budget: "$45/hr Contract",
    url: "https://example.com/gig",
    source: "Remote Freelance",
    tags: ["3D Assets"]
  }
];

async function fetchSerpApiGigs() {
  return []; 
}

async function main() {
  console.log("Starting Server-Side Gig Aggregate with Auto-Remote Processing...");
  const apiGigs = await fetchSerpApiGigs();
  
  const processedManual = MANUAL_GIGS.map(g => ({
    ...g,
    tags: applyRemoteTag(g.tags, g.source, g.title)
  }));
  
  const allGigs = [...processedManual, ...apiGigs];
  
  fs.writeFileSync('gigs.json', JSON.stringify(allGigs, null, 2));
  console.log(`Successfully generated gigs.json with ${allGigs.length} items.`);
}

main();