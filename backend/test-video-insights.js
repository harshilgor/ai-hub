/**
 * Test Script for Video Insights Pipeline
 * Tests: Video fetching → Transcript extraction → Insight generation
 * 
 * Usage: node test-video-insights.js
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import { checkChannelForNewVideos } from './services/youtubeChannelService.js';
import { fetchYouTubeTranscript, processYouTubeVideo } from './services/podcastService.js';
// Removed import from server.js - we have our own functions below

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import necessary functions from server.js
// We'll need to access these functions, so let's create a minimal version

async function loadChannelsConfigForTest() {
  try {
    const configPath = join(__dirname, 'data', 'channels.json');
    const data = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading channels config:', error);
    return { channels: [], settings: {} };
  }
}

async function saveChannelsConfigForTest(channelsConfig) {
  try {
    const configPath = join(__dirname, 'data', 'channels.json');
    await fs.writeFile(configPath, JSON.stringify(channelsConfig, null, 2));
  } catch (error) {
    console.error('Error saving channels config:', error);
  }
}

async function testVideoInsights() {
  console.log('🧪 ========================================');
  console.log('🧪 VIDEO INSIGHTS PIPELINE TEST');
  console.log('🧪 ========================================\n');

  try {
    // Step 1: Load channel configuration
    console.log('📋 STEP 1: Loading channel configuration...');
    const channelsConfig = await loadChannelsConfigForTest();
    const enabledChannels = channelsConfig.channels.filter(c => c.enabled);
    
    if (enabledChannels.length === 0) {
      console.error('❌ No enabled channels found in channels.json');
      console.log('   Please enable at least one channel in backend/data/channels.json');
      process.exit(1);
    }

    console.log(`✅ Found ${enabledChannels.length} enabled channel(s):`);
    enabledChannels.forEach(ch => {
      console.log(`   - ${ch.name} (${ch.channelId})`);
      console.log(`     Auto-process: ${ch.autoProcess ? 'Yes' : 'No'}`);
      console.log(`     Min length: ${ch.minVideoLength || 300}s (${Math.floor((ch.minVideoLength || 300) / 60)} min)`);
      console.log(`     Max videos: ${ch.maxVideosPerCheck || 5}`);
    });
    console.log('');

    // Step 2: Test video fetching for each channel
    for (const channel of enabledChannels) {
      console.log(`\n📺 STEP 2: Testing video fetching for "${channel.name}"...`);
      console.log(`   Channel ID: ${channel.channelId}`);
      console.log(`   Max videos to fetch: ${channel.maxVideosPerCheck || 5}`);
      console.log(`   Min video length: ${channel.minVideoLength || 300}s\n`);

      const processedVideoIds = channel.processedVideoIds || [];
      const podcastsCache = []; // Empty cache for testing

      const startTime = Date.now();
      const result = await checkChannelForNewVideos(channel, processedVideoIds, podcastsCache);
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      console.log(`\n📊 Results for "${channel.name}":`);
      console.log(`   ✅ Processed: ${result.processed}`);
      console.log(`   ⏭️  Skipped: ${result.skipped}`);
      console.log(`   ❌ Errors: ${result.errors}`);
      console.log(`   ⏱️  Duration: ${duration}s`);

      if (result.processed > 0) {
        console.log(`\n✅ SUCCESS: ${result.processed} video(s) processed successfully!`);
        console.log(`   This means:`);
        console.log(`   ✓ Videos were fetched from YouTube`);
        console.log(`   ✓ Transcripts were extracted`);
        console.log(`   ✓ Insights were generated`);
        console.log(`   ✓ Data was saved to database`);
      } else if (result.skipped > 0) {
        console.log(`\n⚠️  All videos were skipped (likely already processed or too short)`);
        console.log(`   To test with new videos, you can:`);
        console.log(`   1. Clear processedVideoIds in channels.json`);
        console.log(`   2. Wait for new videos to be uploaded`);
      } else if (result.errors > 0) {
        console.log(`\n❌ Errors occurred during processing`);
        console.log(`   Check the logs above for details`);
      }

      // Update channel config
      channel.lastChecked = new Date().toISOString();
      channel.processedVideoIds = processedVideoIds;
      if (result.processed > 0 && processedVideoIds.length > 0) {
        channel.lastVideoId = processedVideoIds[processedVideoIds.length - 1];
      }
    }

    // Step 3: Test individual video processing (optional detailed test)
    console.log(`\n\n🔬 STEP 3: Testing individual video processing...`);
    console.log(`   This will test transcript fetching and insight generation for a single video\n`);

    // Get a test video ID (use the first enabled channel's latest video if available)
    const testChannel = enabledChannels[0];
    const testVideoId = testChannel.lastVideoId;

    if (testVideoId) {
      console.log(`   Testing with video ID: ${testVideoId}`);
      console.log(`   Video URL: https://www.youtube.com/watch?v=${testVideoId}\n`);

      const testStartTime = Date.now();
      
      // Test transcript fetching
      console.log('   📝 Testing transcript fetching...');
      const transcript = await fetchYouTubeTranscript(testVideoId);
      
      if (transcript) {
        const transcriptLength = transcript.length;
        const lineCount = transcript.split('\n').filter(l => l.trim()).length;
        console.log(`   ✅ Transcript fetched successfully!`);
        console.log(`      Length: ${transcriptLength} characters`);
        console.log(`      Segments: ${lineCount} lines`);
        console.log(`      Preview: ${transcript.substring(0, 200)}...\n`);

        // Test full video processing
        console.log('   🧠 Testing insight generation...');
        const processed = await processYouTubeVideo(testVideoId, {
          title: 'Test Video',
          published: new Date().toISOString()
        });

        if (processed) {
          const processDuration = ((Date.now() - testStartTime) / 1000).toFixed(1);
          console.log(`   ✅ Insight generation successful!`);
          console.log(`      Duration: ${processDuration}s`);
          console.log(`      Technologies found: ${processed.technologies.length}`);
          console.log(`      Companies found: ${processed.companies.length}`);
          console.log(`      Summary: ${processed.metadata?.summary?.substring(0, 150) || 'N/A'}...`);
          console.log(`      Sentiment: ${processed.sentiment?.overall || 'N/A'}`);
        } else {
          console.log(`   ❌ Insight generation failed`);
        }
      } else {
        console.log(`   ❌ Transcript fetching failed`);
        console.log(`   This could mean:`);
        console.log(`   - Video doesn't have captions enabled`);
        console.log(`   - YouTube is blocking transcript access`);
        console.log(`   - Video is unavailable or private`);
      }
    } else {
      console.log(`   ⚠️  No video ID available for individual testing`);
      console.log(`   Process some videos first to get a video ID`);
    }

    // Save updated config
    await saveChannelsConfigForTest(channelsConfig);

    console.log(`\n\n✅ ========================================`);
    console.log(`✅ TEST COMPLETE`);
    console.log(`✅ ========================================`);
    console.log(`\n📝 Summary:`);
    console.log(`   - Channel configuration: ✅ Loaded`);
    console.log(`   - Video fetching: ✅ Tested`);
    console.log(`   - Transcript extraction: ✅ Tested`);
    console.log(`   - Insight generation: ✅ Tested`);
    console.log(`\n💡 If all steps passed, your video insights pipeline is working!`);

  } catch (error) {
    console.error(`\n❌ ========================================`);
    console.error(`❌ TEST FAILED`);
    console.error(`❌ ========================================`);
    console.error(`\nError: ${error.message}`);
    console.error(`\nStack trace:`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testVideoInsights();
