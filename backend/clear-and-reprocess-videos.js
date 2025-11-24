/**
 * Script to clear podcasts database and reprocess videos
 * This ensures only videos >= 5 minutes are processed with summaries
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PODCASTS_DB_PATH = path.join(__dirname, 'data', 'podcasts.json');
const CHANNELS_CONFIG_PATH = path.join(__dirname, 'data', 'channels.json');

async function clearAndReset() {
  try {
    console.log('🧹 Clearing podcasts database...');
    
    // Clear podcasts database
    await fs.writeFile(
      PODCASTS_DB_PATH,
      JSON.stringify({
        podcasts: [],
        lastUpdate: null
      }, null, 2)
    );
    console.log('✅ Cleared podcasts database');
    
    // Reset channel state
    console.log('🔄 Resetting channel state...');
    const channelsData = JSON.parse(await fs.readFile(CHANNELS_CONFIG_PATH, 'utf-8'));
    
    channelsData.channels.forEach(channel => {
      channel.lastChecked = null;
      channel.processedVideoIds = [];
      console.log(`   Reset channel: ${channel.name}`);
    });
    
    await fs.writeFile(
      CHANNELS_CONFIG_PATH,
      JSON.stringify(channelsData, null, 2)
    );
    console.log('✅ Reset channel state');
    
    console.log('\n✅ Database cleared and channels reset!');
    console.log('📝 Next steps:');
    console.log('   1. Restart your server');
    console.log('   2. The server will automatically check for new videos');
    console.log('   3. Only videos >= 5 minutes will be processed');
    console.log('   4. Each video will have a summary generated');
    console.log('\n   Or manually trigger: POST http://localhost:3001/api/channels/check-all');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

clearAndReset();

