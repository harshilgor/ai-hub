# Hugging Face Paper Fetcher

A Python script to fetch research paper metadata and related resources from Hugging Face Hub API.

## Features

- 📄 Fetch paper metadata by arXiv ID
- 🤖 Find related Hugging Face models
- 📊 Find related datasets
- 🚀 Find related Spaces (demos)
- ✨ Beautiful formatted output
- 🛡️ Graceful error handling

## Installation

1. Install required dependencies:
```bash
pip install -r scripts/requirements_hf.txt
```

Or simply:
```bash
pip install requests
```

## Usage

```bash
python scripts/fetch_hf_paper.py <arxiv_id>
```

### Examples

```bash
# Basic usage
python scripts/fetch_hf_paper.py 2301.00001

# With version
python scripts/fetch_hf_paper.py 2301.00001v1

# With prefix
python scripts/fetch_hf_paper.py arxiv:2301.00001
```

## Output

The script will display:
- Paper metadata (title, authors, summary, etc.)
- List of related models
- List of related datasets
- List of related Spaces (demos)
- Summary statistics

## Notes

- No authentication required for public API access
- Not all arXiv papers are indexed in Hugging Face Hub
- The script searches for resources that reference the paper ID
- Results are limited to top 10 items per category for readability

## Example Output

```
================================================================================
📄 RESEARCH PAPER METADATA: 2301.00001
================================================================================

📋 PAPER INFORMATION
--------------------------------------------------------------------------------
Title:       Example Paper Title
Authors:     Author One, Author Two
Summary:     This is a summary of the paper...
Published:   2023-01-01
Link:        https://arxiv.org/abs/2301.00001

🤖 RELATED MODELS (5)
--------------------------------------------------------------------------------
1. model-name-1
   Type: text-generation
   Downloads: 1,234

📊 RELATED DATASETS (2)
--------------------------------------------------------------------------------
1. dataset-name-1
   Downloads: 567

🚀 RELATED SPACES (DEMOS) (3)
--------------------------------------------------------------------------------
1. space-name-1
   SDK: gradio
   Likes: 42
```

