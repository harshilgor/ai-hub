#!/usr/bin/env python3
"""
Fetch research paper metadata and related resources from Hugging Face Hub API.

This script uses the Hugging Face Hub API to:
- Get paper metadata by arXiv ID
- Find related models, datasets, and Spaces
- Display results in a readable format
"""

import requests
import json
import sys
from typing import Dict, List, Optional
from urllib.parse import quote


class HuggingFacePaperFetcher:
    """Fetches paper metadata and related resources from Hugging Face Hub."""
    
    BASE_URL = "https://huggingface.co/api"
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'HuggingFace-Paper-Fetcher/1.0'
        })
    
    def fetch_paper_metadata(self, arxiv_id: str) -> Optional[Dict]:
        """
        Fetch paper metadata from Hugging Face Hub by arXiv ID.
        
        Args:
            arxiv_id: arXiv paper ID (e.g., '2301.00001' or '2301.00001v1')
        
        Returns:
            Dictionary containing paper metadata or None if not found
        """
        # Clean arXiv ID (remove 'v1', 'v2', etc. if present, or keep it)
        clean_id = arxiv_id.replace('arxiv:', '').replace('arXiv:', '')
        
        # Try different API endpoints
        endpoints = [
            f"{self.BASE_URL}/papers/{clean_id}",
            f"{self.BASE_URL}/papers/arxiv:{clean_id}",
            f"{self.BASE_URL}/papers/arXiv:{clean_id}",
        ]
        
        for endpoint in endpoints:
            try:
                response = self.session.get(endpoint, timeout=10)
                if response.status_code == 200:
                    return response.json()
                elif response.status_code == 404:
                    continue
                else:
                    print(f"⚠️  API returned status {response.status_code} for {endpoint}")
            except requests.exceptions.RequestException as e:
                print(f"⚠️  Error fetching from {endpoint}: {e}")
                continue
        
        return None
    
    def search_models_by_paper(self, arxiv_id: str) -> List[Dict]:
        """
        Search for models that reference this arXiv paper.
        
        Args:
            arxiv_id: arXiv paper ID
        
        Returns:
            List of model metadata dictionaries
        """
        clean_id = arxiv_id.replace('arxiv:', '').replace('arXiv:', '')
        
        try:
            # Search models by paper ID
            search_url = f"{self.BASE_URL}/models"
            params = {
                'search': f'arxiv:{clean_id}',
                'limit': 50
            }
            
            response = self.session.get(search_url, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                return data if isinstance(data, list) else []
        except requests.exceptions.RequestException as e:
            print(f"⚠️  Error searching models: {e}")
        
        return []
    
    def search_datasets_by_paper(self, arxiv_id: str) -> List[Dict]:
        """
        Search for datasets that reference this arXiv paper.
        
        Args:
            arxiv_id: arXiv paper ID
        
        Returns:
            List of dataset metadata dictionaries
        """
        clean_id = arxiv_id.replace('arxiv:', '').replace('arXiv:', '')
        
        try:
            search_url = f"{self.BASE_URL}/datasets"
            params = {
                'search': f'arxiv:{clean_id}',
                'limit': 50
            }
            
            response = self.session.get(search_url, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                return data if isinstance(data, list) else []
        except requests.exceptions.RequestException as e:
            print(f"⚠️  Error searching datasets: {e}")
        
        return []
    
    def search_spaces_by_paper(self, arxiv_id: str) -> List[Dict]:
        """
        Search for Spaces (demos) that reference this arXiv paper.
        
        Args:
            arxiv_id: arXiv paper ID
        
        Returns:
            List of Space metadata dictionaries
        """
        clean_id = arxiv_id.replace('arxiv:', '').replace('arXiv:', '')
        
        try:
            search_url = f"{self.BASE_URL}/spaces"
            params = {
                'search': f'arxiv:{clean_id}',
                'limit': 50
            }
            
            response = self.session.get(search_url, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                return data if isinstance(data, list) else []
        except requests.exceptions.RequestException as e:
            print(f"⚠️  Error searching spaces: {e}")
        
        return []
    
    def fetch_all_resources(self, arxiv_id: str) -> Dict:
        """
        Fetch all resources related to a paper.
        
        Args:
            arxiv_id: arXiv paper ID
        
        Returns:
            Dictionary containing paper metadata and all related resources
        """
        print(f"🔍 Fetching resources for arXiv paper: {arxiv_id}\n")
        
        # Fetch paper metadata
        paper_metadata = self.fetch_paper_metadata(arxiv_id)
        
        # Search for related resources
        print("📦 Searching for related resources...")
        models = self.search_models_by_paper(arxiv_id)
        datasets = self.search_datasets_by_paper(arxiv_id)
        spaces = self.search_spaces_by_paper(arxiv_id)
        
        return {
            'paper': paper_metadata,
            'models': models,
            'datasets': datasets,
            'spaces': spaces
        }
    
    def print_results(self, results: Dict, arxiv_id: str):
        """
        Print results in a readable format.
        
        Args:
            results: Dictionary containing paper and resource data
            arxiv_id: Original arXiv ID for reference
        """
        print("=" * 80)
        print(f"📄 RESEARCH PAPER METADATA: {arxiv_id}")
        print("=" * 80)
        print()
        
        # Print paper metadata
        paper = results.get('paper')
        if paper:
            print("📋 PAPER INFORMATION")
            print("-" * 80)
            print(f"Title:       {paper.get('title', 'N/A')}")
            print(f"Authors:     {', '.join(paper.get('authors', [])) if paper.get('authors') else 'N/A'}")
            print(f"Summary:     {paper.get('summary', 'N/A')[:200]}..." if len(paper.get('summary', '')) > 200 else f"Summary:     {paper.get('summary', 'N/A')}")
            print(f"Published:   {paper.get('published', 'N/A')}")
            print(f"Link:        {paper.get('link', 'N/A')}")
            if paper.get('categories'):
                print(f"Categories:  {', '.join(paper.get('categories', []))}")
            print()
        else:
            print("❌ Paper metadata not found in Hugging Face Hub")
            print("   Note: Not all arXiv papers are indexed in Hugging Face")
            print()
        
        # Print models
        models = results.get('models', [])
        print(f"🤖 RELATED MODELS ({len(models)})")
        print("-" * 80)
        if models:
            for i, model in enumerate(models[:10], 1):  # Show first 10
                model_id = model.get('id', model.get('modelId', 'Unknown'))
                print(f"{i}. {model_id}")
                if model.get('pipeline_tag'):
                    print(f"   Type: {model.get('pipeline_tag')}")
                if model.get('downloads'):
                    print(f"   Downloads: {model.get('downloads', 0):,}")
                print()
            if len(models) > 10:
                print(f"   ... and {len(models) - 10} more models")
                print()
        else:
            print("   No models found")
            print()
        
        # Print datasets
        datasets = results.get('datasets', [])
        print(f"📊 RELATED DATASETS ({len(datasets)})")
        print("-" * 80)
        if datasets:
            for i, dataset in enumerate(datasets[:10], 1):  # Show first 10
                dataset_id = dataset.get('id', dataset.get('datasetId', 'Unknown'))
                print(f"{i}. {dataset_id}")
                if dataset.get('downloads'):
                    print(f"   Downloads: {dataset.get('downloads', 0):,}")
                print()
            if len(datasets) > 10:
                print(f"   ... and {len(datasets) - 10} more datasets")
                print()
        else:
            print("   No datasets found")
            print()
        
        # Print spaces
        spaces = results.get('spaces', [])
        print(f"🚀 RELATED SPACES (DEMOS) ({len(spaces)})")
        print("-" * 80)
        if spaces:
            for i, space in enumerate(spaces[:10], 1):  # Show first 10
                space_id = space.get('id', space.get('spaceId', 'Unknown'))
                print(f"{i}. {space_id}")
                if space.get('sdk'):
                    print(f"   SDK: {space.get('sdk')}")
                if space.get('likes'):
                    print(f"   Likes: {space.get('likes', 0)}")
                print()
            if len(spaces) > 10:
                print(f"   ... and {len(spaces) - 10} more spaces")
                print()
        else:
            print("   No spaces found")
            print()
        
        # Summary
        print("=" * 80)
        print("📊 SUMMARY")
        print("=" * 80)
        print(f"Paper found:     {'✅ Yes' if paper else '❌ No'}")
        print(f"Models found:    {len(models)}")
        print(f"Datasets found:  {len(datasets)}")
        print(f"Spaces found:    {len(spaces)}")
        print("=" * 80)


def main():
    """Main function to run the script."""
    if len(sys.argv) < 2:
        print("Usage: python fetch_hf_paper.py <arxiv_id>")
        print("\nExample:")
        print("  python fetch_hf_paper.py 2301.00001")
        print("  python fetch_hf_paper.py 2301.00001v1")
        print("  python fetch_hf_paper.py arxiv:2301.00001")
        sys.exit(1)
    
    arxiv_id = sys.argv[1]
    
    try:
        fetcher = HuggingFacePaperFetcher()
        results = fetcher.fetch_all_resources(arxiv_id)
        fetcher.print_results(results, arxiv_id)
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

