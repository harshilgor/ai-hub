import { supabase } from './supabaseService.js';
import axios from 'axios';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Generate a Meta-Narrative for a specific topic
 * @param {string} topic - The topic to synthesize (e.g., "Scaling Laws")
 */
export async function generateMetaNarrativeForTopic(topic) {
  if (!supabase || !OPENAI_API_KEY) return;

  console.log(`🧪 Synthesizing narrative for topic: ${topic}...`);

  // 1. Fetch relevant atoms
  const { data: atoms, error } = await supabase
    .from('insight_atoms')
    .select('*')
    .ilike('topic', `%${topic}%`) // Fuzzy match
    .order('created_at', { ascending: false })
    .limit(30); // Limit context window

  if (error || !atoms || atoms.length < 3) {
    console.log(`   ⚠️ Not enough data points for ${topic} (Found ${atoms ? atoms.length : 0})`);
    return null;
  }

  // 2. Fetch links between these atoms
  const atomIds = atoms.map(a => a.id);
  const { data: links } = await supabase
    .from('atom_links')
    .select('*')
    .or(`atom_a_id.in.(${atomIds.join(',')}),atom_b_id.in.(${atomIds.join(',')})`);

  // 3. Synthesize with LLM
  const narrative = await synthesizeNarrative(topic, atoms, links || []);

  if (narrative) {
    // 4. Save to DB
    await supabase
      .from('meta_narratives')
      .insert({
        title: narrative.title,
        summary: narrative.summary,
        content: narrative.content,
        primary_topic: topic,
        atom_ids: atomIds
      });

    console.log(`✅ Created Meta-Narrative: "${narrative.title}"`);
    return narrative;
  }
  return null;
}

async function synthesizeNarrative(topic, atoms, links) {
  const atomsText = atoms.map(a => 
    `- [${a.id}] ${a.claim} (Stance: ${a.stance}, Source: ${a.entity})`
  ).join('\n');

  const linksText = links.map(l => 
    `- Link between ${l.atom_a_id} and ${l.atom_b_id}: ${l.relationship_type} (${l.explanation})`
  ).join('\n');

  const prompt = `You are an elite intelligence analyst. Write a "State of the Conversation" report on the topic: "${topic}".

DATA POINTS (Atoms):
${atomsText}

RELATIONSHIPS (Links):
${linksText}

TASK:
Synthesize these disparate points into a cohesive narrative.
- Identify the consensus vs. the conflict.
- Highlight who is agreeing/disagreeing.
- Spot emerging trends.
- Don't just list facts; tell the story of the debate.

Return JSON:
{
  "title": "Catchy, insight-driven title",
  "summary": "2-sentence executive summary",
  "content": "Markdown formatted full report (approx 300-500 words). Use citations like [Source Name] when referencing specific claims."
}`;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini', // Or gpt-4o for better quality
        messages: [
          { role: 'system', content: 'You are a narrative synthesizer. Return only JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return JSON.parse(response.data.choices[0].message.content);
  } catch (error) {
    console.error('❌ Synthesis generation failed:', error.message);
    return null;
  }
}

/**
 * Run a daily synthesis pass
 * Picks top topics from recent atoms and generates reports
 */
export async function runDailySynthesis() {
  if (!supabase) return;
  
  // Get recent topics
  // Simple approach: Fetch recent atoms and count topics
  const { data: recentAtoms } = await supabase
    .from('insight_atoms')
    .select('topic')
    .order('created_at', { ascending: false })
    .limit(100);
    
  if (!recentAtoms) return;
  
  const topicCounts = {};
  recentAtoms.forEach(a => {
    topicCounts[a.topic] = (topicCounts[a.topic] || 0) + 1;
  });
  
  // Get top 3 topics
  const topTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(t => t[0]);
    
  console.log(`🔄 Running Daily Synthesis on topics: ${topTopics.join(', ')}`);
  
  for (const topic of topTopics) {
    await generateMetaNarrativeForTopic(topic);
  }
}

