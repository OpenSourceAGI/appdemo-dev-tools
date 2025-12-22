"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Star, ExternalLink, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string
  html_url: string
  clone_url: string
  stargazers_count: number
  language: string
  updated_at: string
}

interface GitHubRepoSearchProps {
  onSelect: (repoUrl: string, repoName: string) => void
  selectedRepos: Array<{ url: string; name: string }>
}

export function GitHubRepoSearch({ onSelect, selectedRepos }: GitHubRepoSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<GitHubRepo[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.trim().length > 2) {
        searchRepos()
      } else {
        setResults([])
      }
    }, 500)

    return () => clearTimeout(delayDebounce)
  }, [query])

  const searchRepos = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/github-search?q=${encodeURIComponent(query)}`)
      const data = await response.json()

      if (response.ok) {
        setResults(data.results || [])
      } else {
        throw new Error(data.error || "Failed to search")
      }
    } catch (error) {
      console.error("[v0] GitHub search error:", error)
      toast({
        title: "Search Failed",
        description: "Failed to search GitHub repositories",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectRepo = (repo: GitHubRepo) => {
    onSelect(repo.clone_url, repo.full_name)
    toast({
      title: "Repository Added",
      description: `${repo.full_name} will be automatically deployed to Dokploy`,
    })
  }

  const isRepoSelected = (repoUrl: string) => {
    return selectedRepos.some((r) => r.url === repoUrl)
  }

  return (
    <>
      <CardHeader>
        <CardTitle>GitHub Repository Deployment</CardTitle>
        <CardDescription>Search for repositories to deploy with Dokploy</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search GitHub repositories..."
              className="pl-9"
            />
          </div>
        </div>

        {loading && <div className="text-sm text-muted-foreground">Searching...</div>}

        {results.length > 0 && (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {results.map((repo) => (
              <div
                key={repo.id}
                className="p-3 border rounded-lg hover:bg-accent/50 transition-colors flex items-start justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm truncate">{repo.full_name}</span>
                    {repo.language && (
                      <Badge variant="secondary" className="text-xs">
                        {repo.language}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{repo.description}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {repo.stargazers_count.toLocaleString()}
                    </span>
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View on GitHub
                    </a>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleSelectRepo(repo)}
                  disabled={isRepoSelected(repo.clone_url)}
                  variant={isRepoSelected(repo.clone_url) ? "secondary" : "default"}
                >
                  {isRepoSelected(repo.clone_url) ? (
                    "Added"
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}

        {query.trim().length > 2 && results.length === 0 && !loading && (
          <div className="text-sm text-muted-foreground text-center py-4">No repositories found</div>
        )}
      </CardContent>
    </>
  )
}
