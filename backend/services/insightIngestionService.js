import { supabase } from './supabaseService.js';
import { generateEmbedding } from './embeddingService.js';

/**
 * Ingest a video breakdown into the Atomic Insight Graph
 * @param {Object} breakdown - The video breakdown object
 * @returns {Promise<Object>} - Stats about the ingestion
 */
export async function ingestBreakdownIntoGraph(breakdown) {
  if (!supabase) {
    console.warn('⚠️ Supabase not configured. Cannot ingest insights into graph.');
    return null;
  }
  
  const { videoId, segments, metadata } = breakdown;
  console.log(`🧠 Ingesting insights for video ${videoId} into graph...`);
  
  let atomCount = 0;
  let errorCount = 0;
  
  try {
    // 1. Extract all insights from all segments
    const allInsights = [];
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const insights = segment.insights || [];
      
      for (const insight of insights) {
        allInsights.push({
          insight,
          segmentIndex: i,
          segmentStart: segment.startTime,
          segmentEnd: segment.endTime
        });
      }
    }
    
    if (allInsights.length === 0) {
      console.log('   No insights found to ingest.');
      return { atomCount: 0 };
    }
    
    console.log(`   Found ${allInsights.length} insights to atomize.`);
    
    // 2. Process in batches to avoid rate limits
    const BATCH_SIZE = 5;
    for (let i = 0; i < allInsights.length; i += BATCH_SIZE) {
      const batch = allInsights.slice(i, i + BATCH_SIZE);
      const atomsToInsert = [];
      
      // Generate embeddings in parallel
      const embeddings = await Promise.all(
        batch.map(item => generateEmbedding(item.insight.text))
      );
      
      for (let j = 0; j < batch.length; j++) {
        const item = batch[j];
        const embedding = embeddings[j];
        
        if (!embedding) {
          errorCount++;
          continue;
        }
        
        // Map insight type/depth to atom structure
        // "Atom" structure matches the SQL table
        const atom = {
          video_id: videoId,
          segment_index: item.segmentIndex,
          topic: item.insight.topic || 'General', // Needs enhancement later
          entity: item.insight.speaker || metadata.channel || null, // Simple heuristic for now
          claim: item.insight.text,
          stance: determineStance(item.insight),
          certainty: determineCertainty(item.insight),
          quote: item.insight.context || null,
          start_time: parseTimestamp(item.segmentStart),
          end_time: parseTimestamp(item.segmentEnd),
          embedding: embedding
        };
        
        atomsToInsert.push(atom);
      }
      
      if (atomsToInsert.length > 0) {
        const { error } = await supabase
          .from('insight_atoms')
          .insert(atomsToInsert);
          
        if (error) {
          console.error(`   ❌ Error inserting atoms batch: ${error.message}`);
          errorCount += atomsToInsert.length;
        } else {
          atomCount += atomsToInsert.length;
        }
      }
    }
    
    console.log(`✅ Graph Ingestion Complete: ${atomCount} atoms created (${errorCount} errors).`);
    return { atomCount, errorCount };
    
  } catch (error) {
    console.error(`❌ Error ingesting breakdown: ${error.message}`);
    return { atomCount, errorCount, error: error.message };
  }
}

// Helpers
function determineStance(insight) {
  // Heuristic mapping based on insight type or keywords
  // In a real system, LLM would classify this explicitly
  const text = (insight.text || '').toLowerCase();
  if (text.includes('fail') || text.includes('problem') || text.includes('risk') || text.includes('worse')) return 'Critical';
  if (text.includes('success') || text.includes('best') || text.includes('great') || text.includes('improve')) return 'Optimistic';
  return 'Neutral';
}

function determineCertainty(insight) {
  const text = (insight.text || '').toLowerCase();
  if (text.includes('maybe') || text.includes('possibly') || text.includes('might')) return 'Low';
  if (text.includes('definitely') || text.includes('always') || text.includes('must')) return 'High';
  return 'Medium';
}

function parseTimestamp(timestamp) {
  if (!timestamp) return 0;
  // Parse HH:MM:SS to seconds
  const parts = timestamp.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

