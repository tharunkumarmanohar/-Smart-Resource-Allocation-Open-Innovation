import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Helper function to read datasets
async function loadDataset(filename) {
  try {
    const filePath = path.join(__dirname, filename);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
    return [];
  }
}

// 1. Get all volunteers or filter by search query (skill/status)
app.get('/api/volunteers', async (req, res) => {
  let volunteers = await loadDataset('volunteers_dataset.json');
  const { skill, status, maxDistance } = req.query;

  if (skill && skill !== 'All') {
    volunteers = volunteers.filter(v => 
      v.skills.map(s => s.toLowerCase()).includes(skill.toLowerCase())
    );
  }
  
  if (status) {
    volunteers = volunteers.filter(v => v.status.toLowerCase() === status.toLowerCase());
  }
  
  if (maxDistance) {
    volunteers = volunteers.filter(v => v.distance_mi <= parseFloat(maxDistance));
  }

  res.json(volunteers);
});

// 2. Get all community needs
app.get('/api/needs', async (req, res) => {
  let needs = await loadDataset('needs_dataset.json');
  const { urgency } = req.query;
  
  if (urgency) {
    needs = needs.filter(n => n.urgency.toLowerCase() === urgency.toLowerCase());
  }

  res.json(needs);
});

// 3. Smart Match Engine: Match volunteers to a specific need based on skills
app.get('/api/match/:needId', async (req, res) => {
  const needs = await loadDataset('needs_dataset.json');
  const volunteers = await loadDataset('volunteers_dataset.json');
  
  const need = needs.find(n => n.id === req.params.needId);
  if (!need) {
    return res.status(404).json({ error: 'Need not found' });
  }

  // Calculate match scores
  const scoredVolunteers = volunteers.filter(v => v.status === 'Available').map(v => {
    let score = 0;
    let matchedSkills = 0;
    
    // Skill matching (heavily weighted)
    need.required_skills.forEach(reqSkill => {
      if (v.skills.some(s => s.toLowerCase() === reqSkill.toLowerCase())) {
        matchedSkills++;
      }
    });
    
    if (matchedSkills > 0) {
      score += (matchedSkills / need.required_skills.length) * 80; // 80% weight to skills
    }
    
    // Distance matching (20% weight, closer is better)
    const distanceScore = Math.max(0, 20 - (v.distance_mi * 2)); 
    score += distanceScore;
    
    return {
      volunteer: v,
      matchScore: Math.round(score),
      matchedSkills
    };
  }).filter(v => v.matchScore > 0);
  
  // Sort by highest score
  scoredVolunteers.sort((a, b) => b.matchScore - a.matchScore);

  res.json({
    need,
    matches: scoredVolunteers
  });
});

app.listen(PORT, () => {
  console.log(`Smart Resource Allocation Backend running on http://localhost:${PORT}`);
});
