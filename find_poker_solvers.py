#!/usr/bin/env python3
"""
Script to search for poker solver libraries on GitHub.
This will help identify suitable poker solvers to integrate.
"""

import subprocess
import json

def search_github_repos(query, sort="stars", limit=10):
    """Search GitHub repositories using gh CLI."""
    cmd = [
        "gh", "search", "repos", query,
        "--sort", sort,
        "--limit", str(limit),
        "--json", "fullName,description,url,stargazersCount,language"
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0 and result.stdout:
            return json.loads(result.stdout)
    except Exception as e:
        print(f"Error searching GitHub: {e}")
    
    return []

def main():
    """Search for poker solver repositories."""
    print("Searching for poker solver libraries on GitHub...\n")
    
    queries = [
        "poker solver texas holdem",
        "poker GTO solver",
        "poker equity calculator",
        "holdem solver python"
    ]
    
    all_repos = []
    seen_urls = set()
    
    for query in queries:
        print(f"Searching for: {query}")
        repos = search_github_repos(query, limit=5)
        
        if not repos:
            continue
            
        for repo in repos:
            url = repo.get('url', '')
            if url and url not in seen_urls:
                seen_urls.add(url)
                all_repos.append(repo)
    
    # Sort by stars
    all_repos.sort(key=lambda x: x.get('stargazersCount', 0), reverse=True)
    
    print("\n" + "="*80)
    print("Top Poker Solver Repositories:")
    print("="*80 + "\n")
    
    for i, repo in enumerate(all_repos[:10], 1):
        name = repo.get('fullName', repo.get('name', 'Unknown'))
        desc = repo.get('description', 'No description')
        stars = repo.get('stargazersCount', 0)
        lang = repo.get('language', 'Unknown')
        url = repo.get('url', '')
        
        print(f"{i}. {name}")
        print(f"   Stars: {stars} | Language: {lang}")
        print(f"   {desc[:100]}{'...' if len(desc) > 100 else ''}")
        print(f"   {url}\n")

if __name__ == "__main__":
    main()
