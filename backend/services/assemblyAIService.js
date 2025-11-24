/**
 * Assembly AI Service - Transcribe YouTube videos
 * Downloads audio temporarily and uploads to Assembly AI for transcription
 * Based on Assembly AI SDK pattern similar to Python example
 */

import { AssemblyAI } from 'assemblyai';
import fs from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';

let assemblyAIClient = null;
let ytDlp = null;
let YTDlpWrap = null;

/**
 * Initialize Assembly AI client
 */
function initializeAssemblyAI() {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ ASSEMBLYAI_API_KEY not set. Assembly AI transcription will be disabled.');
    return null;
  }
  
  if (!assemblyAIClient) {
    assemblyAIClient = new AssemblyAI({ apiKey });
  }
  
  return assemblyAIClient;
}

/**
 * Download audio temporarily using yt-dlp and upload to Assembly AI
 * yt-dlp is more reliable than Node.js wrappers for bypassing YouTube restrictions
 */
async function downloadAndUploadToAssemblyAI(youtubeUrl, client) {
  let tempAudioPath = null;
  
  try {
    console.log(`   Downloading audio temporarily for Assembly AI upload...`);
    
    // Initialize yt-dlp (it will download the binary automatically if needed)
    if (!ytDlp) {
      console.log(`   Initializing yt-dlp...`);
      try {
        // Dynamic import to handle ES module correctly
        if (!YTDlpWrap) {
          const ytdlpModule = await import('yt-dlp-wrap');
          YTDlpWrap = ytdlpModule.default || ytdlpModule;
        }
        ytDlp = new YTDlpWrap();
        // The library will automatically download yt-dlp binary on first use
      } catch (error) {
        console.error(`   Failed to initialize yt-dlp: ${error.message}`);
        throw error;
      }
    }
    
    // Create temporary file path
    tempAudioPath = path.join(tmpdir(), `youtube_audio_${Date.now()}.%(ext)s`);
    
    // Get video info first to check duration
    console.log(`   Getting video info...`);
    const videoInfo = await ytDlp.getVideoInfo(youtubeUrl);
    const duration = videoInfo.duration || 0;
    
    // Skip very long videos (> 2 hours) to avoid high costs
    if (duration > 7200) {
      console.log(`   ⚠️ Video is too long (${Math.floor(duration / 60)} minutes), skipping`);
      return null;
    }
    
    // Download audio using yt-dlp (more reliable than Node.js wrappers)
    console.log(`   Extracting audio from YouTube using yt-dlp...`);
    await ytDlp.exec([
      youtubeUrl,
      '-f', 'bestaudio/best',
      '-x', // Extract audio only
      '--audio-format', 'mp3',
      '--audio-quality', '0', // Best quality
      '-o', tempAudioPath,
      '--no-playlist',
      '--quiet', // Less verbose output
      '--no-warnings'
    ]);
    
    // Find the actual file (yt-dlp adds extension)
    const actualPath = tempAudioPath.replace('%(ext)s', 'mp3');
    let finalPath = actualPath;
    
    // Try to find the file with any extension
    try {
      await fs.access(actualPath);
      finalPath = actualPath;
    } catch {
      // Try other common extensions
      const extensions = ['mp3', 'm4a', 'webm', 'opus'];
      for (const ext of extensions) {
        const testPath = tempAudioPath.replace('%(ext)s', ext);
        try {
          await fs.access(testPath);
          finalPath = testPath;
          break;
        } catch {
          continue;
        }
      }
    }
    
    // Check if file was created and has content
    try {
      const stats = await fs.stat(finalPath);
      if (stats.size === 0) {
        throw new Error('Audio file is empty');
      }
      console.log(`   Audio downloaded (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
    } catch (e) {
      throw new Error('Audio file was not created or is invalid');
    }
    
    console.log(`   Uploading audio to Assembly AI...`);
    
    // Read the audio file
    const fileBuffer = await fs.readFile(finalPath);
    
    // Upload file to Assembly AI using file buffer
    const transcript = await client.transcripts.transcribe({
      audio: fileBuffer,
      speaker_labels: true,
      language_code: 'en'
    });
    
    // Clean up temporary file immediately after upload starts
    try {
      await fs.unlink(finalPath);
      console.log(`   Temporary file cleaned up`);
    } catch (e) {
      // Ignore cleanup errors
    }
    
    return transcript;
  } catch (error) {
    // Clean up on error
    if (tempAudioPath) {
      // Try to find and delete the file
      const extensions = ['mp3', 'm4a', 'webm', 'opus'];
      for (const ext of extensions) {
        const testPath = tempAudioPath.replace('%(ext)s', ext);
        try {
          await fs.unlink(testPath).catch(() => {});
        } catch {
          // Ignore
        }
      }
    }
    
    const errorMsg = error.message || error.toString();
    console.error(`   Download/upload failed: ${errorMsg.substring(0, 200)}`);
    
    // Provide helpful error messages
    if (errorMsg.includes('Video unavailable') || errorMsg.includes('Private video')) {
      console.error(`   Video is unavailable or private`);
    } else if (errorMsg.includes('403') || errorMsg.includes('Forbidden')) {
      console.error(`   YouTube blocked audio download (403 Forbidden)`);
      console.error(`   yt-dlp may need to be updated or video is restricted`);
    } else if (errorMsg.includes('Sign in to confirm your age')) {
      console.error(`   Age-restricted video`);
    }
    
    return null;
  }
}

/**
 * Transcribe YouTube video using Assembly AI
 * @param {string} youtubeUrl - Full YouTube URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID)
 * @returns {Promise<string|null>} - Transcript text in diarized format with timestamps
 */
export async function transcribeYouTubeURL(youtubeUrl) {
  try {
    const client = initializeAssemblyAI();
    if (!client) {
      console.log('   Assembly AI not available (API key not set)');
      return null;
    }

    console.log(`   Transcribing YouTube URL with Assembly AI: ${youtubeUrl}`);
    
    // Try to get transcript - download audio temporarily and upload
    let transcript = await downloadAndUploadToAssemblyAI(youtubeUrl, client);
    
    if (!transcript) {
      console.error(`   ❌ Failed to download/upload audio for transcription`);
      return null;
    }

    // Wait for transcription to complete (polling)
    console.log(`   Transcription status: ${transcript.status}`);
    
    // Poll until transcription is complete
    let finalTranscript = transcript;
    const maxWaitTime = 600000; // 10 minutes max
    const startTime = Date.now();
    
    while (finalTranscript.status === 'queued' || finalTranscript.status === 'processing') {
      // Check timeout
      if (Date.now() - startTime > maxWaitTime) {
        console.error(`   ❌ Transcription timeout after ${maxWaitTime / 1000} seconds`);
        return null;
      }
      
      console.log(`   Waiting for transcription... (status: ${finalTranscript.status})`);
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
      finalTranscript = await client.transcripts.get(finalTranscript.id);
      
      if (!finalTranscript) {
        console.error(`   ❌ Failed to get transcript status`);
        return null;
      }
    }

    // Check for errors (similar to Python: if transcript.status == "error")
    if (finalTranscript.status === 'error') {
      const errorMsg = finalTranscript.error || 'Unknown error';
      console.error(`   ❌ Assembly AI transcription failed: ${errorMsg}`);
      return null;
    }

    if (finalTranscript.status !== 'completed') {
      console.error(`   ❌ Unexpected transcription status: ${finalTranscript.status}`);
      return null;
    }

    // Get transcript text (similar to Python: transcript.text)
    if (!finalTranscript.text) {
      console.error(`   ❌ No transcript text found in Assembly AI response`);
      return null;
    }

    // Convert to diarized format with timestamps
    let diarizedText = '';
    
    // Prefer utterances if available (with speaker labels)
    if (finalTranscript.utterances && finalTranscript.utterances.length > 0) {
      finalTranscript.utterances.forEach(utterance => {
        const start = (utterance.start || 0) * 1000; // Convert to milliseconds
        const speaker = `Speaker ${utterance.speaker || 'A'}`;
        const text = utterance.text || '';
        
        if (text && text.trim()) {
          const timestamp = formatTimestamp(start);
          diarizedText += `${timestamp} [${speaker}]: ${text.trim()}\n`;
        }
      });
    } else if (finalTranscript.words && finalTranscript.words.length > 0) {
      // Fallback: use words array to build segments with speaker info
      let currentSegment = '';
      let currentStart = 0;
      let currentSpeaker = 'Speaker A';
      const segmentDuration = 5000; // 5 seconds per segment
      
      finalTranscript.words.forEach((word, index) => {
        const wordStart = (word.start || 0) * 1000; // Convert to milliseconds
        const wordText = word.text || '';
        const wordSpeaker = word.speaker !== undefined ? `Speaker ${word.speaker}` : 'Speaker A';
        
        // Start new segment if:
        // 1. First word
        // 2. Speaker changed
        // 3. Time gap > segmentDuration
        if (index === 0 || 
            wordSpeaker !== currentSpeaker || 
            (wordStart - currentStart) > segmentDuration) {
          
          // Save previous segment
          if (currentSegment.trim()) {
            const timestamp = formatTimestamp(currentStart);
            diarizedText += `${timestamp} [${currentSpeaker}]: ${currentSegment.trim()}\n`;
          }
          
          // Start new segment
          currentSegment = wordText;
          currentStart = wordStart;
          currentSpeaker = wordSpeaker;
        } else {
          // Continue current segment
          currentSegment += ' ' + wordText;
        }
      });
      
      // Save last segment
      if (currentSegment.trim()) {
        const timestamp = formatTimestamp(currentStart);
        diarizedText += `${timestamp} [${currentSpeaker}]: ${currentSegment.trim()}\n`;
      }
    } else {
      // Final fallback: use plain text (similar to Python: transcript.text)
      const timestamp = formatTimestamp(0);
      diarizedText = `${timestamp} [Speaker]: ${finalTranscript.text}\n`;
    }

    if (diarizedText.trim()) {
      const segmentCount = finalTranscript.utterances?.length || finalTranscript.words?.length || 1;
      console.log(`   ✅ Successfully transcribed via Assembly AI (${segmentCount} segments)`);
      return diarizedText;
    }

    console.error(`   ❌ No transcript text found in Assembly AI response`);
    return null;
    
  } catch (error) {
    const errorMsg = error.message || error.toString();
    console.error(`   ❌ Assembly AI transcription failed: ${errorMsg.substring(0, 200)}`);
    
    if (error.response) {
      console.error(`   API Error Status: ${error.response.status}`);
      console.error(`   API Error: ${JSON.stringify(error.response.data)?.substring(0, 300)}`);
    }
    
    return null;
  }
}

/**
 * Format timestamp from milliseconds to HH:MM:SS
 */
function formatTimestamp(ms) {
  const seconds = Math.floor(ms / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Check if Assembly AI is configured
 */
export function isAssemblyAIConfigured() {
  return !!process.env.ASSEMBLYAI_API_KEY;
}

