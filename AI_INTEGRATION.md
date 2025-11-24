# AI Integration for Technology Reads

## Overview
The system now supports optional AI-powered content generation for technology overviews. It can use OpenAI, Anthropic, or fall back to enhanced template-based generation.

## Setup

### Option 1: OpenAI (Recommended)
1. Get an OpenAI API key from https://platform.openai.com/api-keys
2. Add to `backend/.env`:
```env
AI_PROVIDER=openai
AI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-4o-mini  # Optional: defaults to gpt-4o-mini
```

### Option 2: Anthropic Claude
1. Get an Anthropic API key from https://console.anthropic.com/
2. Add to `backend/.env`:
```env
AI_PROVIDER=anthropic
AI_API_KEY=your-anthropic-api-key-here
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022  # Optional
```

### Option 3: No AI (Template-based)
If no API key is provided, the system uses enhanced template-based generation:
```env
AI_PROVIDER=none
# Or simply don't set AI_API_KEY
```

## How It Works

1. **With AI**: The system sends structured data (paper counts, citations, companies, etc.) to the AI API, which generates natural, detailed overviews.

2. **Without AI**: The system uses enhanced template-based generation that creates detailed, structured narratives from the data.

## Benefits of AI Integration

- **More Natural Language**: AI generates fluid, engaging prose
- **Better Context**: AI can synthesize complex information more effectively
- **Adaptive**: AI adjusts tone and detail based on the technology
- **Comprehensive**: AI can create longer, more detailed overviews

## Cost Considerations

- **OpenAI GPT-4o-mini**: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- **Anthropic Claude 3.5 Sonnet**: ~$3 per 1M input tokens, ~$15 per 1M output tokens
- **Template-based**: Free, but less natural

For 10 technology reads:
- OpenAI: ~$0.01-0.02 per generation
- Anthropic: ~$0.05-0.10 per generation

## Fallback Behavior

If AI generation fails (API error, rate limit, etc.), the system automatically falls back to template-based generation, ensuring the service always works.

