import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'data', 'papers.json');

/**
 * Remove all OpenAlex papers from the database
 */
async function removeOpenAlexPapers() {
  try {
    console.log('🧹 Removing OpenAlex papers from database...');
    
    // Read the database
    const data = await fs.readFile(DB_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    const papers = parsed.papers || [];
    
    console.log(`📊 Total papers before cleanup: ${papers.length}`);
    
    // Count OpenAlex papers
    const openAlexCount = papers.filter(p => p.sourceId === 'openalex').length;
    console.log(`📊 OpenAlex papers to remove: ${openAlexCount}`);
    
    // Filter out OpenAlex papers
    const filteredPapers = papers.filter(p => {
      const sourceId = p.sourceId || '';
      return sourceId !== 'openalex';
    });
    
    console.log(`📊 Total papers after cleanup: ${filteredPapers.length}`);
    console.log(`✅ Removed ${papers.length - filteredPapers.length} OpenAlex papers`);
    
    // Update the database
    parsed.papers = filteredPapers;
    
    // Update date tracking if needed
    if (filteredPapers.length > 0) {
      const sortedByDate = [...filteredPapers].sort((a, b) => {
        const dateA = new Date(a.published || a.updated || 0);
        const dateB = new Date(b.published || b.updated || 0);
        return dateB.getTime() - dateA.getTime();
      });
      
      const newest = new Date(sortedByDate[0].published || sortedByDate[0].updated || 0);
      const oldest = new Date(sortedByDate[sortedByDate.length - 1].published || sortedByDate[sortedByDate.length - 1].updated || 0);
      
      parsed.lastPaperDate = newest.toISOString();
      parsed.oldestPaperDate = oldest.toISOString();
      
      console.log(`📅 Updated date range: ${parsed.oldestPaperDate} to ${parsed.lastPaperDate}`);
    } else {
      parsed.lastPaperDate = null;
      parsed.oldestPaperDate = null;
    }
    
    // Save the cleaned database
    await fs.writeFile(DB_PATH, JSON.stringify(parsed, null, 2));
    console.log(`💾 Saved cleaned database to ${DB_PATH}`);
    console.log(`✅ Cleanup complete!`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run cleanup
removeOpenAlexPapers();

