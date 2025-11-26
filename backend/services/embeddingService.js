import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const EMBEDDING_MODEL = 'text-embedding-3-small';

/**
 * Generate vector embedding for a text string
 * @param {string} text - The text to embed
 * @returns {Promise<number[]>} - The vector embedding (1536 dimensions)
 */
export async function generateEmbedding(text) {
  if (!text || !text.trim()) return null;
  if (!OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not set. Cannot generate embeddings.');
    return null;
  }

  try {
    // Clean text: remove newlines and excessive whitespace
    const cleanText = text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    
    const response = await axios.post(
      'https://api.openai.com/v1/embeddings',
      {
        model: EMBEDDING_MODEL,
        input: cleanText
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.data[0].embedding;
  } catch (error) {
    console.error(`❌ Embedding generation failed: ${error.message}`);
    if (error.response) {
      console.error(`   API Error: ${JSON.stringify(error.response.data)}`);
    }
    return null;
  }
}

/**
 * Generate embeddings for a batch of texts
 * @param {string[]} texts - Array of texts to embed
 * @returns {Promise<number[][]>} - Array of vector embeddings
 */
export async function generateEmbeddingBatch(texts) {
  if (!texts || texts.length === 0) return [];
  if (!OPENAI_API_KEY) return texts.map(() => null);

  try {
    // Clean texts
    const cleanTexts = texts.map(t => t.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim());
    
    const response = await axios.post(
      'https://api.openai.com/v1/embeddings',
      {
        model: EMBEDDING_MODEL,
        input: cleanTexts
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.data.map(item => item.embedding);
  } catch (error) {
    console.error(`❌ Batch embedding generation failed: ${error.message}`);
    return texts.map(() => null);
  }
}

