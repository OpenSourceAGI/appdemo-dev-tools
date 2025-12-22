"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Search, Download, Star, ExternalLink } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface DockerImage {
  name: string
  description: string
  star_count: number
  pull_count: number
  is_official: boolean
  is_automated: boolean
}

export function DockerImageSearch({
  onSelect,
  dockerServices,
  onUpdateServices,
}: {
  onSelect: (image: string) => void
  dockerServices: Array<{ name: string; image: string; ports?: string[] }>
  onUpdateServices: (services: Array<{ name: string; image: string; ports?: string[] }>) => void
}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<DockerImage[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const popularImages = [
    "nginx",
    "redis",
    "postgres",
    "mysql",
    "mongodb",
    "node",
    "python",
    "ubuntu",
    "alpine",
    "caddy",
    "traefik",
    "portainer",
  ]

  useEffect(() => {
    if (query.trim()) {
      const filtered = popularImages.filter((img) => img.toLowerCase().includes(query.toLowerCase()))
      setSuggestions(filtered)
    } else {
      setSuggestions([])
    }
  }, [query])

  const searchImages = async (searchQuery?: string) => {
    const finalQuery = searchQuery || query
    if (!finalQuery.trim()) return

    setLoading(true)
    setSearched(true)
    setShowSuggestions(false)

    try {
      console.log("[v0] Searching for:", finalQuery)
      const response = await fetch(`/api/docker-search?query=${encodeURIComponent(finalQuery)}`)

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("[v0] Search results:", data)
      setResults(data.results || [])
    } catch (error) {
      console.error("[v0] Failed to search Docker Hub:", error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      searchImages()
    }
  }

  const handleSelectImage = (imageName: string) => {
    console.log("[v0] Selected image:", imageName)
    const serviceName =
      imageName
        .split("/")
        .pop()
        ?.replace(/[^a-z0-9]/gi, "_") || "service"

    const newService = {
      name: serviceName,
      image: imageName,
      ports: imageName.includes("nginx")
        ? ["80:80", "443:443"]
        : imageName.includes("postgres")
          ? ["5432:5432"]
          : imageName.includes("mysql")
            ? ["3306:3306"]
            : imageName.includes("redis")
              ? ["6379:6379"]
              : imageName.includes("mongodb")
                ? ["27017:27017"]
                : [],
    }

    const updatedServices = [...dockerServices, newService]
    onUpdateServices(updatedServices)

    // Also add to custom script as before
    onSelect(`# Added ${imageName} to docker-compose.yml`)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    setShowSuggestions(false)
    searchImages(suggestion)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Docker Hub Search</CardTitle>
        <CardDescription>Find and add Docker images to your setup script</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search Docker images (e.g., nginx, postgres)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="pl-9"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-md z-10 max-h-48 overflow-auto">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    className="w-full px-3 py-2 text-sm text-left hover:bg-accent transition-colors"
                    onMouseDown={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button onClick={() => searchImages()} disabled={loading || !query.trim()} size="sm">
            {loading ? "Searching..." : "Search"}
          </Button>
        </div>

        {searched && (
          <ScrollArea className="h-[300px] rounded-md border">
            {results.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                {loading ? "Searching Docker Hub..." : "No images found"}
              </div>
            ) : (
              <div className="space-y-2 p-2">
                {results.map((image, index) => (
                  <Card
                    key={`${image.name}-${index}`}
                    className="p-3 hover:bg-accent/50 transition-colors cursor-pointer"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-sm font-mono">{image.name || "Unknown"}</h4>
                            {image.is_official && (
                              <Badge variant="default" className="text-xs h-5">
                                Official
                              </Badge>
                            )}
                            {image.is_automated && (
                              <Badge variant="secondary" className="text-xs h-5">
                                Automated
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {image.description || "No description available"}
                          </p>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              {image.star_count.toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Download className="h-3 w-3" />
                              {image.pull_count.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs flex-1 bg-transparent"
                          onClick={() => handleSelectImage(image.name)}
                        >
                          Add to Script
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2"
                          onClick={() =>
                            window.open(
                              image.name.includes("/")
                                ? `https://hub.docker.com/r/${image.name}`
                                : `https://hub.docker.com/_/${image.name}`,
                              "_blank",
                            )
                          }
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
