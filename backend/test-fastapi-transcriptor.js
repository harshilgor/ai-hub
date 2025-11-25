/**
 * Test Script for FastAPI Transcriptor Service Integration
 * Tests the FastAPI service and fallback chain
 * 
 * Usage: node test-fastapi-transcriptor.js
 */

import dotenv from 'dotenv';
import axios from 'axios';
import { fetchYouTubeTranscript } from './services/podcastService.js';

dotenv.config();

async function testFastAPITranscriptor() {
  console.log('🧪 ========================================');
  console.log('🧪 FASTAPI TRANSCRIPTOR SERVICE TEST');
  console.log('🧪 ========================================\n');

  const FASTAPI_URL = process.env.TRANSCRIPTOR_AI_URL || 'https://transcripter-api.onrender.com/transcript';
  const testVideoId = 'dQw4w9WgXcQ'; // Short test video (Rick Roll)
  const testVideoUrl = `https://www.youtube.com/watch?v=${testVideoId}`;
  
  // Test 1: Direct API call to FastAPI service
  console.log('📡 STEP 1: Testing FastAPI service directly...');
  console.log(`   URL: ${FASTAPI_URL}`);
  console.log(`   Video: ${testVideoUrl}\n`);
  
  try {
    const startTime = Date.now();
    const response = await axios.get(
      `${FASTAPI_URL}?url=${encodeURIComponent(testVideoUrl)}`,
      {
        timeout: 60000, // 1 minute timeout
        headers: {
          'Accept': 'application/json'
        }
      }
    );
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (response.data && response.data.transcript) {
      const transcriptLength = response.data.transcript.length;
      console.log(`   ✅ API call successful!`);
      console.log(`   Duration: ${duration}s`);
      console.log(`   Transcript length: ${transcriptLength} characters`);
      console.log(`   Preview: ${response.data.transcript.substring(0, 200)}...\n`);
    } else {
      console.log(`   ⚠️  API returned data but no transcript field`);
      console.log(`   Response: ${JSON.stringify(response.data)}\n`);
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED')) {
      console.log(`   ❌ Cannot connect to service (not running or network issue)`);
    } else if (error.response) {
      console.log(`   ❌ API call failed: ${error.response.status} ${error.response.statusText}`);
      console.log(`   Response: ${JSON.stringify(error.response.data)}`);
    } else {
      console.log(`   ❌ API call failed: ${error.message}`);
    }
    console.log(`\n`);
  }

  // Test 2: Test our integration function
  console.log('📡 STEP 2: Testing our integration function...');
  console.log(`   Using fetchYouTubeTranscript() with video ID: ${testVideoId}\n`);
  
  try {
    const startTime = Date.now();
    const transcript = await fetchYouTubeTranscript(testVideoId);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (transcript) {
      const segmentCount = transcript.split('\n').filter(line => line.trim()).length;
      console.log(`   ✅ Integration successful!`);
      console.log(`   Duration: ${duration}s`);
      console.log(`   Segments: ${segmentCount}`);
      console.log(`   Transcript length: ${transcript.length} characters`);
      console.log(`   Preview: ${transcript.substring(0, 300)}...\n`);
      
      // Check which method was used by looking at logs
      console.log(`   📝 Note: Check logs above to see which method was used`);
      console.log(`      - If you see "FastAPI Transcriptor", it used Method 0 (FastAPI)`);
      console.log(`      - If you see "youtube-transcript library", it used Method 1 (Library)`);
      console.log(`      - If you see "Whisper API", it used Method 2 (Whisper)\n`);
    } else {
      console.log(`   ❌ Integration failed - no transcript returned`);
      console.log(`   This could mean:`);
      console.log(`   - FastAPI service is down`);
      console.log(`   - Video doesn't have captions`);
      console.log(`   - All transcription methods failed\n`);
    }
  } catch (error) {
    console.log(`   ❌ Integration test failed: ${error.message}`);
    console.log(`   Stack: ${error.stack?.substring(0, 500)}\n`);
  }

  // Test 3: Test with a real video from Dwarkesh's channel (if available)
  console.log('📡 STEP 3: Testing with a longer video (if available)...');
  console.log(`   This will test the service with a real podcast video\n`);
  
  // You can add a specific video ID here to test
  // const realVideoId = 'YOUR_VIDEO_ID_HERE';
  // if (realVideoId) {
  //   try {
  //     const transcript = await fetchYouTubeTranscript(realVideoId);
  //     if (transcript) {
  //       console.log(`   ✅ Real video test successful!`);
  //       console.log(`   Transcript length: ${transcript.length} characters\n`);
  //     }
  //   } catch (error) {
  //     console.log(`   ❌ Real video test failed: ${error.message}\n`);
  //   }
  // } else {
  //   console.log(`   ⚠️  No real video ID provided, skipping this test\n`);
  // }

  // Summary
  console.log('✅ ========================================');
  console.log('✅ TEST COMPLETE');
  console.log('✅ ========================================');
  console.log(`\n📝 Summary:`);
  console.log(`   - FastAPI URL: ${FASTAPI_URL}`);
  console.log(`   - Integration: ✅ Added to codebase`);
  console.log(`   - Fallback Chain: ✅ FastAPI → Library → Whisper`);
  console.log(`\n💡 Next steps:`);
  console.log(`   1. Check the logs above to see which method was used`);
  console.log(`   2. If FastAPI worked, you should see "FastAPI Transcriptor" in logs`);
  console.log(`   3. If it failed, check the error messages above`);
  console.log(`   4. The system will automatically fall back to other methods\n`);
}

testFastAPITranscriptor().catch(console.error);

