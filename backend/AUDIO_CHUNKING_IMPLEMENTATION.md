# Audio Chunking Implementation for Whisper API

## Overview

The Whisper API has a 25MB file size limit. For large audio files (e.g., 100MB podcasts), we now automatically split them into smaller chunks, process each chunk sequentially, and combine the transcripts with proper timestamps.

## Implementation Details

### Key Features

1. **Automatic Chunking**: Files > 25MB are automatically split into chunks
2. **Size Management**: Each chunk targets 20MB to stay safely under the 25MB limit
3. **Sequential Processing**: Chunks are processed one at a time to maintain order
4. **Timestamp Preservation**: Each chunk's timestamps are adjusted by its start time offset
5. **Format Conversion**: All chunks are converted to MP3 format for Whisper compatibility
6. **Automatic Cleanup**: Temporary chunk files are deleted after processing

### How It Works

1. **File Size Check**: After downloading audio, check if file size > 25MB
2. **Audio Analysis**: Use `ffprobe` to get duration and bitrate
3. **Chunk Calculation**: Calculate number of chunks needed based on target size (20MB)
4. **Audio Splitting**: Use `ffmpeg` to split audio into chunks:
   - Each chunk is converted to MP3 format
   - 128kbps bitrate to keep file size manageable
   - 44.1kHz sample rate, stereo
5. **Sequential Transcription**: Process each chunk with Whisper API:
   - Add chunk's start time offset to all timestamps
   - Maintain chronological order
6. **Transcript Combination**: Combine all chunk transcripts in sequence
7. **Cleanup**: Delete all temporary chunk files

### Functions Added

#### `splitAudioIntoChunks(audioPath, targetSizeMB = 20)`
- Splits audio file into chunks using `ffmpeg`
- Returns array of chunk info: `{path, startTime, duration}`
- Handles bitrate detection and estimation
- Ensures all chunks are in MP3 format

#### `transcribeChunk(chunkPath, openaiApiKey, offsetSeconds = 0)`
- Transcribes a single audio chunk using Whisper API
- Adjusts timestamps by `offsetSeconds` to maintain chronological order
- Returns diarized transcript text

### Example Flow

```
1. Download audio: 100MB file
2. Check size: 100MB > 25MB → chunking required
3. Analyze: Duration 2 hours, bitrate 128kbps
4. Calculate: Need ~5 chunks (20MB each)
5. Split: Create 5 MP3 chunks
6. Process:
   - Chunk 1: 00:00:00 - 00:24:00 → transcript with timestamps 00:00:00+
   - Chunk 2: 00:24:00 - 00:48:00 → transcript with timestamps 00:24:00+
   - Chunk 3: 00:48:00 - 01:12:00 → transcript with timestamps 00:48:00+
   - Chunk 4: 01:12:00 - 01:36:00 → transcript with timestamps 01:12:00+
   - Chunk 5: 01:36:00 - 02:00:00 → transcript with timestamps 01:36:00+
7. Combine: Merge all transcripts in order
8. Cleanup: Delete all chunk files
```

### Requirements

- **ffmpeg**: Required for audio splitting (already installed)
- **ffprobe**: Required for audio analysis (bundled with ffmpeg)
- **OpenAI API Key**: Required for Whisper transcription

### Error Handling

- If chunking fails, the original file is cleaned up
- If a chunk transcription fails, other chunks still process
- Empty chunks are logged but don't stop processing
- All temporary files are cleaned up even on errors

### Logging

The implementation provides detailed logging:
- File size detection
- Chunk calculation details
- Progress for each chunk (e.g., "Transcribing chunk 2/5...")
- Success/failure status for each chunk
- Final transcript segment count

### Performance Considerations

- Chunks are processed sequentially (not in parallel) to maintain order
- Each chunk transcription can take up to 5 minutes (Whisper API timeout)
- Total processing time = (number of chunks) × (average chunk processing time)
- For a 100MB file split into 5 chunks: ~5-25 minutes total

## Testing

To test the chunking functionality:

1. Process a video with a large audio file (> 25MB)
2. Check logs for chunking messages:
   ```
   ⚠️ File exceeds 25MB limit, chunking required
   📦 Audio file is large, splitting into 5 chunks
   📝 Transcribing chunk 1/5...
   ✅ Chunk 1/5 transcribed successfully
   ...
   ✅ Successfully transcribed all chunks via OpenAI Whisper (X segments total)
   ```

## Future Improvements

- Parallel chunk processing (with careful timestamp management)
- Adaptive chunk sizing based on actual file size
- Retry logic for failed chunks
- Progress tracking for long videos

