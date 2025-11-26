import { supabase } from './supabaseService.js';
import axios from 'axios';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Find and create correlations for a specific atom
 * @param {string} atomId - The ID of the atom to find links for
 */
export async function findCorrelationsForAtom(atomId) {
  if (!supabase) return;
  
  // 1. Get the source atom
  const { data: atom, error } = await supabase
    .from('insight_atoms')
    .select('*')
    .eq('id', atomId)
    .single();
    
  if (error || !atom) {
    console.error(`❌ Error fetching atom ${atomId}:`, error);
    return;
  }
  
  // 2. Find semantic neighbors
  // Using the RPC function we created
  const { data: neighbors, error: searchError } = await supabase
    .rpc('match_atoms', {
      query_embedding: atom.embedding,
      match_threshold: 0.75, // High threshold for relevance
      match_count: 10
    });
    
  if (searchError) {
    console.error(`❌ Error searching neighbors:`, searchError);
    return;
  }
  
  // Filter out self and same-video atoms (optional, sometimes same video links are good)
  // For "Web of Knowledge", we mostly care about cross-video links
  const candidates = neighbors.filter(n => n.id !== atom.id);
  
  console.log(`   Found ${candidates.length} potential links for atom "${atom.claim.substring(0, 30)}..."`);
  
  for (const neighbor of candidates) {
    // Check if link already exists
    const { data: existingLink } = await supabase
      .from('atom_links')
      .select('id')
      .or(`and(atom_a_id.eq.${atom.id},atom_b_id.eq.${neighbor.id}),and(atom_a_id.eq.${neighbor.id},atom_b_id.eq.${atom.id})`)
      .single();
      
    if (existingLink) continue;
    
    // 3. Classify relationship using LLM
    const relationship = await classifyRelationship(atom, neighbor);
    
    if (relationship && relationship.type !== 'UNRELATED') {
      // 4. Create Link
      await supabase
        .from('atom_links')
        .insert({
          atom_a_id: atom.id,
          atom_b_id: neighbor.id,
          relationship_type: relationship.type,
          confidence: relationship.confidence,
          explanation: relationship.explanation
        });
        
      console.log(`   🔗 Linked: ${relationship.type} (${relationship.confidence}) - ${neighbor.claim.substring(0, 30)}...`);
    }
  }
}

/**
 * Classify the relationship between two claims using LLM
 */
async function classifyRelationship(atomA, atomB) {
  if (!OPENAI_API_KEY) return null;

  const prompt = `Analyze the relationship between these two claims extracted from video transcripts.
  
CLAIM A: "${atomA.claim}" (Topic: ${atomA.topic}, Stance: ${atomA.stance})
CLAIM B: "${atomB.claim}" (Topic: ${atomB.topic}, Stance: ${atomB.stance})

Determine if they are:
1. CORROBORATION (They agree/support each other)
2. CONTRADICTION (They disagree/conflict)
3. EXTENSION (B adds new detail/nuance to A)
4. PREDICTION_CHECK (One predicts, the other confirms/denies result)
5. RELATED (Same topic, but no strong logical link)
6. UNRELATED

Return JSON:
{
  "type": "CORROBORATION" | "CONTRADICTION" | "EXTENSION" | "PREDICTION_CHECK" | "RELATED" | "UNRELATED",
  "confidence": 0.0-1.0,
  "explanation": "One sentence explaining why."
}`;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a logical relationship classifier. Return only JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.0,
        max_tokens: 150
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error('❌ Relationship classification failed:', error.message);
    return null;
  }
}

/**
 * Run correlation pass on all recent unlinked atoms
 * This would be called by a Cron job
 */
export async function runCorrelationPass(limit = 20) {
  if (!supabase) return;
  
  // Find atoms with few links (heuristic for "new/unprocessed")
  // Ideally we'd have a 'last_processed_at' column, but simpler for now:
  // Just pick the most recent atoms
  const { data: atoms } = await supabase
    .from('insight_atoms')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(limit);
    
  if (!atoms) return;
  
  console.log(`🔄 Running correlation pass on ${atoms.length} recent atoms...`);
  for (const atom of atoms) {
    await findCorrelationsForAtom(atom.id);
  }
}

