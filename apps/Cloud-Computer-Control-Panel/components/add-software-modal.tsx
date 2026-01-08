"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Package, X } from "lucide-react"
import { DockerImageSearch } from "./docker-image-search"
import { GitHubRepoSearch } from "./github-repo-search"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { getSSHKey } from "@/lib/ssh-key-utils"

interface AddSoftwareModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  instance: {
    instanceId: string
    publicIp?: string
    region: string
    keyName?: string
  }
  credentials: {
    accessKeyId: string
    secretAccessKey: string
    region: string
  }
  onInstallationStart?: (instanceId: string, commandId: string, installing: string, region: string) => void
}

export function AddSoftwareModal({
  open,
  onOpenChange,
  instance,
  credentials,
  onInstallationStart,
}: AddSoftwareModalProps) {
  const [installDokploy, setInstallDokploy] = useState(false)
  const [dokployApiKey, setDokployApiKey] = useState("")
  const [installDevToolsShell, setInstallDevToolsShell] = useState(false)
  const [dockerServices, setDockerServices] = useState<Array<{ name: string; image: string; ports?: string[] }>>([])
  const [githubRepos, setGithubRepos] = useState<Array<{ url: string; name: string }>>([])
  const [customScript, setCustomScript] = useState("")
  const [installing, setInstalling] = useState(false)
  const { toast } = useToast()

  const handleInstall = async () => {
    console.log("[AddSoftwareModal] Install button clicked")
    console.log("[AddSoftwareModal] Install options:", {
      installDokploy,
      installDevToolsShell,
      dockerServicesCount: dockerServices.length,
      githubReposCount: githubRepos.length,
      hasCustomScript: !!customScript.trim(),
    })

    if (
      !installDokploy &&
      !installDevToolsShell &&
      dockerServices.length === 0 &&
      githubRepos.length === 0 &&
      !customScript.trim()
    ) {
      console.log("[AddSoftwareModal] Validation failed: Nothing to install")
      toast({
        title: "Nothing to Install",
        description: "Please select at least one software option from the tabs above",
        variant: "destructive",
      })
      return
    }

    // Check if we have the necessary information for SSH
    if (!instance.publicIp) {
      console.log("[AddSoftwareModal] Validation failed: No public IP")
      toast({
        title: "No Public IP",
        description: "Instance doesn't have a public IP address yet",
        variant: "destructive",
      })
      return
    }

    if (!instance.keyName) {
      console.log("[AddSoftwareModal] Validation failed: No SSH key name")
      toast({
        title: "No SSH Key",
        description: "Instance doesn't have an SSH key associated",
        variant: "destructive",
      })
      return
    }

    // Get SSH key from localStorage
    console.log("[AddSoftwareModal] Retrieving SSH key:", instance.keyName)
    const sshKey = getSSHKey(instance.keyName)
    if (!sshKey) {
      console.log("[AddSoftwareModal] Validation failed: SSH key not found in localStorage")
      toast({
        title: "SSH Key Not Found",
        description: "SSH key not found in localStorage. Cannot connect to instance.",
        variant: "destructive",
      })
      return
    }

    console.log("[AddSoftwareModal] Starting SSH installation...")
    setInstalling(true)

    try {
      console.log("[AddSoftwareModal] Sending request to /api/instances/install-software-ssh")
      const response = await fetch("/api/instances/install-software-ssh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instanceId: instance.instanceId,
          publicIp: instance.publicIp,
          keyName: instance.keyName,
          privateKey: sshKey.privateKey,
          installDokploy,
          dokployApiKey,
          installDevToolsShell,
          dockerServices,
          githubRepos,
          customScript,
        }),
      })

      const data = await response.json()
      console.log("[AddSoftwareModal] API response:", { ok: response.ok, status: response.status, data })

      if (!response.ok) {
        throw new Error(data.error || "Failed to install software")
      }

      // If installation completed successfully via SSH
      if (data.success) {
        console.log("[AddSoftwareModal] Installation successful via SSH")
        toast({
          title: "Software Installation Completed",
          description: `Successfully installed ${data.installing} via SSH.`,
        })

        onOpenChange(false)
        // Reset form
        setInstallDokploy(false)
        setDokployApiKey("")
        setInstallDevToolsShell(false)
        setDockerServices([])
        setGithubRepos([])
        setCustomScript("")
      } else {
        // Installation failed
        console.error("[AddSoftwareModal] Installation failed:", data.message)
        toast({
          title: "Installation Failed",
          description: data.message || "Failed to install software on the instance.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[AddSoftwareModal] Install error:", error)
      toast({
        title: "Installation Failed",
        description: error instanceof Error ? error.message : "Failed to install software on the instance",
        variant: "destructive",
      })
    } finally {
      setInstalling(false)
    }
  }

  const removeDockerService = (index: number) => {
    setDockerServices(dockerServices.filter((_, i) => i !== index))
  }

  const removeGithubRepo = (index: number) => {
    setGithubRepos(githubRepos.filter((_, i) => i !== index))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Software to Instance</DialogTitle>
          <DialogDescription>Install additional software on {instance.instanceId}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="dokploy" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dokploy">Dokploy</TabsTrigger>
            <TabsTrigger value="devtools">Dev Tools</TabsTrigger>
            <TabsTrigger value="docker">Docker</TabsTrigger>
            <TabsTrigger value="github">GitHub</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>

          <TabsContent value="dokploy" className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="install-dokploy"
                checked={installDokploy}
                onCheckedChange={(checked) => setInstallDokploy(!!checked)}
              />
              <Label htmlFor="install-dokploy" className="cursor-pointer">
                Install Dokploy (Port 3000)
              </Label>
            </div>

            {installDokploy && (
              <div className="space-y-2">
                <Label htmlFor="dokploy-api-key">Dokploy API Key (Optional)</Label>
                <Input
                  id="dokploy-api-key"
                  placeholder="Enter Dokploy API key for automatic deployment"
                  value={dokployApiKey}
                  onChange={(e) => setDokployApiKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Provide an API key to enable automatic deployment of GitHub repositories
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="devtools" className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="install-devtools-shell"
                checked={installDevToolsShell}
                onCheckedChange={(checked) => setInstallDevToolsShell(!!checked)}
              />
              <Label htmlFor="install-devtools-shell" className="cursor-pointer">
                Install Comprehensive Dev Tools Shell
              </Label>
            </div>

            <Card className="p-4 bg-muted/50">
              <div className="space-y-2 text-sm">
                <p className="font-semibold">Includes:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Fish Shell, Neovim, Nushell, Helix editor</li>
                  <li>Bun, Node.js (via Volta - no sudo issues)</li>
                  <li>Starship prompt, Git, Docker</li>
                  <li>Useful aliases: service_manager, killport, search</li>
                  <li>Support: Ubuntu, Debian, Arch, macOS, Fedora, Alpine</li>
                </ul>
                <p className="text-xs pt-2">
                  Installation:{" "}
                  <code className="bg-background px-1 py-0.5 rounded">wget -qO- dub.sh/dev.sh | bash</code>
                </p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="docker" className="space-y-4">
            <DockerImageSearch
              onSelect={(script) => {
                // Keep for backward compatibility
              }}
              dockerServices={dockerServices}
              onUpdateServices={setDockerServices}
            />

            {dockerServices.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Docker Images:</Label>
                <div className="space-y-2">
                  {dockerServices.map((service, index) => (
                    <Card key={index} className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-sm">{service.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{service.image}</div>
                          {service.ports && service.ports.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {service.ports.map((port, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {port}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeDockerService(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="github" className="space-y-4">
            <Card>
              <GitHubRepoSearch
                onSelect={(url, name) => {
                  setGithubRepos([...githubRepos, { url, name }])
                }}
                selectedRepos={githubRepos}
              />
            </Card>

            {githubRepos.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Repositories:</Label>
                <div className="space-y-2">
                  {githubRepos.map((repo, index) => (
                    <Card key={index} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-mono text-sm">{repo.name}</div>
                        <Button variant="ghost" size="sm" onClick={() => removeGithubRepo(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-script">Custom Shell Script</Label>
              <Textarea
                id="custom-script"
                placeholder="#!/bin/bash&#10;# Add your custom installation commands here..."
                value={customScript}
                onChange={(e) => setCustomScript(e.target.value)}
                className="font-mono text-sm min-h-[300px]"
              />
              <p className="text-xs text-muted-foreground">
                This script will be executed on the server with root privileges
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={installing}>
            Cancel
          </Button>
          <Button onClick={handleInstall} disabled={installing}>
            {installing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Installing...
              </>
            ) : (
              <>
                <Package className="h-4 w-4 mr-2" />
                Install Software
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
