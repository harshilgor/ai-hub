# YouTube Video Analysis System
# Analyzes YouTube channel videos: gets transcripts, generates summaries, extracts entities, and calculates sentiment

# 1. IMPORTS
import warnings
warnings.filterwarnings('ignore')

import os
from pytubefix import Channel
from youtube_transcript_api import YouTubeTranscriptApi
from pytube import YouTube
import whisper
from transformers import pipeline
import spacy
from textblob import TextBlob

# 2. GLOBAL MODEL LOADING
print("Loading models... This may take a moment.")

# Load spaCy model
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("⚠️  spaCy model 'en_core_web_sm' not found. Please run: python -m spacy download en_core_web_sm")
    print("   Continuing without NER extraction...")
    nlp = None

# Load Summarization model
print("   Loading summarization model (facebook/bart-large-cnn)...")
try:
    summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
except Exception as e:
    print(f"   ⚠️  Could not load summarization model: {e}")
    summarizer = None

# Load Whisper model
print("   Loading Whisper model (base)...")
try:
    whisper_model = whisper.load_model("base")
except Exception as e:
    print(f"   ⚠️  Could not load Whisper model: {e}")
    whisper_model = None

print("Models loaded.\n")

# 3. FUNCTION 1: GET VIDEO URLS
def get_channel_videos(channel_url):
    """
    Gets a list of all video URLs from a YouTube channel.
    Uses pytubefix.
    """
    print(f"Getting videos from {channel_url}...")
    try:
        c = Channel(channel_url)
        # pytubefix returns YouTube objects, we need to extract URLs
        video_urls = []
        for video in c.videos:
            try:
                video_urls.append(f"https://www.youtube.com/watch?v={video.video_id}")
            except:
                continue
        print(f"   Found {len(video_urls)} videos.")
        return video_urls
    except Exception as e:
        print(f"   ❌ Error getting channel videos: {e}")
        return []

# 4. FUNCTION 2: GET TRANSCRIPT (The core logic)
def get_transcript(video_url):
    """
    Gets the transcript for a single video.
    Tries youtube-transcript-api first.
    If it fails, falls back to pytube + Whisper.
    """
    video_id = video_url.split("=")[-1] if "=" in video_url else video_url.split("/")[-1]
    transcript_text = None
    
    # Method 1: Try youtube-transcript-api
    try:
        # Create an instance and fetch transcript
        transcript_api = YouTubeTranscriptApi()
        transcript_list = transcript_api.fetch(video_id, languages=['en', 'en-US', 'en-GB'])
        # Combine segments into a single string
        # The API returns FetchedTranscriptSnippet objects with 'text' attribute
        transcript_text = " ".join([item.text for item in transcript_list])
        print(f"   ✅ Method 1: Got transcript for {video_id} using API ({len(transcript_text)} chars).")
        return transcript_text
        
    except Exception as e:
        print(f"   ⚠️  Method 1 failed for {video_id}: {str(e)[:100]}. Trying Method 2 (Whisper)...")
        
        # Method 2: Fallback to Pytube + Whisper
        if not whisper_model:
            print(f"   ❌ Whisper model not available. Skipping {video_id}.")
            return None
            
        try:
            # Download audio using pytube
            yt = YouTube(video_url)
            audio_stream = yt.streams.get_audio_only()
            if not audio_stream:
                print(f"   ❌ No audio stream available for {video_id}.")
                return None
                
            audio_file = audio_stream.download(filename="temp_audio.mp4")
            
            # Transcribe with Whisper
            print(f"   Transcribing with Whisper (this may take a while)...")
            result = whisper_model.transcribe(audio_file)
            transcript_text = result["text"]
            
            # Clean up the temp audio file
            try:
                os.remove(audio_file)
            except:
                pass
            
            print(f"   ✅ Method 2: Got transcript for {video_id} using Whisper ({len(transcript_text)} chars).")
            return transcript_text

        except Exception as e2:
            print(f"   ❌ Method 2 (Whisper) also failed for {video_id}: {str(e2)[:100]}")
            # Clean up temp file if it exists
            try:
                if os.path.exists("temp_audio.mp4"):
                    os.remove("temp_audio.mp4")
            except:
                pass
            return None
            
    return transcript_text

# 5. FUNCTION 3: GET INSIGHTS
def get_insights(full_transcript):
    """
    Analyzes the transcript text and returns a dictionary of insights.
    """
    if not full_transcript:
        return {}

    insights = {}
    
    # Insight 1: Sentiment
    try:
        blob = TextBlob(full_transcript)
        polarity = blob.sentiment.polarity
        # Convert to readable format
        if polarity > 0.1:
            sentiment_label = "Positive"
        elif polarity < -0.1:
            sentiment_label = "Negative"
        else:
            sentiment_label = "Neutral"
        insights["sentiment"] = {
            "label": sentiment_label,
            "score": round(polarity, 3)
        }
    except Exception as e:
        print(f"   ⚠️  Sentiment analysis failed: {e}")
        insights["sentiment"] = None
    
    # Insight 2: Summarization
    if summarizer:
        try:
            # Handle long transcripts by truncating (transformers models have token limits)
            # BART-large-CNN can handle ~1024 tokens, so we'll use first 1000 chars
            transcript_snippet = full_transcript[:1000]
            summary_result = summarizer(transcript_snippet, max_length=150, min_length=30, do_sample=False)
            insights["summary"] = summary_result[0]["summary_text"]
        except Exception as e:
            print(f"   ⚠️  Summarization failed: {e}")
            insights["summary"] = None
    else:
        insights["summary"] = None
    
    # Insight 3: Named Entities (People, Orgs, Places)
    if nlp:
        try:
            doc = nlp(full_transcript)
            entities = []
            for ent in doc.ents:
                if ent.label_ in ["PERSON", "ORG", "GPE", "PRODUCT"]:
                    entities.append((ent.text, ent.label_))
            # Remove duplicates while preserving order
            seen = set()
            unique_entities = []
            for entity in entities:
                if entity not in seen:
                    seen.add(entity)
                    unique_entities.append(entity)
            insights["entities"] = unique_entities
        except Exception as e:
            print(f"   ⚠️  NER extraction failed: {e}")
            insights["entities"] = []
    else:
        insights["entities"] = []
    
    return insights

# 6. MAIN EXECUTION
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="YouTube channel transcript analyzer")
    parser.add_argument("--channel", "--channel-url", dest="channel_url", default=None,
                        help="YouTube channel URL (overrides default)")
    args, unknown = parser.parse_known_args()
    
    # Allow override via CLI arg or environment variable
    default_channel = "https://www.youtube.com/@MrBeast"
    env_channel = os.getenv("YOUTUBE_CHANNEL_URL")
    CHANNEL_URL = args.channel_url or env_channel or default_channel
    
    print("=" * 60)
    print("YouTube Video Analysis System")
    print("=" * 60)
    print()
    
    video_urls = get_channel_videos(CHANNEL_URL)
    
    if not video_urls:
        print("No videos found. Exiting.")
        exit(1)
    
    # Process the first 3 videos as a test
    print(f"\nProcessing first 3 videos (out of {len(video_urls)} total)...\n")
    
    for i, url in enumerate(video_urls[:3], 1):
        print(f"\n{'=' * 60}")
        print(f"PROCESSING VIDEO {i}/3: {url}")
        print(f"{'=' * 60}")
        
        transcript = get_transcript(url)
        
        if transcript:
            print("   Transcript found. Analyzing...")
            insights = get_insights(transcript)
            
            print(f"\n   📊 INSIGHTS:")
            print(f"   Sentiment: {insights.get('sentiment', {}).get('label', 'N/A')} (score: {insights.get('sentiment', {}).get('score', 'N/A')})")
            
            entities = insights.get('entities', [])
            if entities:
                print(f"   Entities ({len(entities)} found):")
                for entity, label in entities[:10]:  # Show first 10
                    print(f"      - {entity} ({label})")
                if len(entities) > 10:
                    print(f"      ... and {len(entities) - 10} more")
            else:
                print(f"   Entities: None found")
            
            summary = insights.get('summary')
            if summary:
                print(f"   Summary: {summary}")
            else:
                print(f"   Summary: Not available")
        else:
            print("   ❌ Could not get transcript for this video.")
        
        print()

