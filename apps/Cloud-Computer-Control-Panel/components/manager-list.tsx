"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Server,
  RefreshCw,
  ExternalLink,
  Loader2,
  Globe,
  Cpu,
  PackagePlus,
  Play,
  Square,
  RotateCw,
  Trash2,
} from "lucide-react"
import { InstanceControls } from "./instance-controls"
import { AddSoftwareModal } from "./add-software-modal"
import { useToast } from "@/hooks/use-toast"

interface Manager {
  id: string
  name: string
  config: any
  instanceId?: string
  publicIp?: string
  state?: string
}

interface EC2Instance {
  instanceId: string
  state: string
  publicIp?: string
  privateIp?: string
  instanceType?: string
  launchTime?: string
  tags?: Array<{ Key: string; Value: string }>
  region: string
  keyName?: string
}

interface InstallationState {
  commandId: string
  status: "InProgress" | "Success" | "Failed" | "Cancelled" | "TimedOut"
  installing: string
  instanceId: string
  region: string
}

interface ManagerListProps {
  credentials: {
    accessKeyId: string
    secretAccessKey: string
    region: string
  }
}

export function ManagerList({ credentials }: ManagerListProps) {
  const [managers, setManagers] = useState<Manager[]>([])
  const [ec2Instances, setEc2Instances] = useState<EC2Instance[]>([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [expandedInstances, setExpandedInstances] = useState<Set<string>>(new Set())
  const [softwareModalOpen, setSoftwareModalOpen] = useState(false)
  const [selectedInstanceForSoftware, setSelectedInstanceForSoftware] = useState<EC2Instance | null>(null)
  const { toast } = useToast()
  const [actionLoading, setActionLoading] = useState<{ instanceId: string; action: string } | null>(null)
  const [installations, setInstallations] = useState<Map<string, InstallationState>>(new Map())

  useEffect(() => {
    loadManagers()
    loadAllRegionsInstances()
  }, [])

  const loadManagers = () => {
    try {
      const stored = localStorage.getItem("ec2Managers")
      if (stored) {
        const parsedManagers = JSON.parse(stored)
        const sanitizedManagers = parsedManagers.map((manager: Manager) => {
          if (manager.config?.keyName && manager.config.keyName.trim() !== "") {
            // Keep valid keyName
          } else {
            // Remove invalid or empty keyName
            const { keyName, ...restConfig } = manager.config
            manager.config = restConfig
          }
          return manager
        })
        setManagers(sanitizedManagers)
        localStorage.setItem("ec2Managers", JSON.stringify(sanitizedManagers))
      }
    } catch (err) {
      console.error("Failed to load managers:", err)
    }
  }

  const loadAllRegionsInstances = async () => {
    setScanning(true)
    try {
      const headers: Record<string, string> = {}

      if (credentials.accessKeyId !== "server-env" && credentials.secretAccessKey !== "server-env") {
        headers["x-aws-access-key-id"] = credentials.accessKeyId
        headers["x-aws-secret-access-key"] = credentials.secretAccessKey
      }
      // If credentials are server-env, API will use environment variables

      headers["x-aws-region"] = credentials.region

      const response = await fetch("/api/instances/all-regions", {
        method: "GET",
        headers,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to scan regions")
      }

      const data = await response.json()

      console.log("[v0] Loaded instances:", data.instances?.length || 0)
      setEc2Instances(data.instances || [])

      const allInstanceIds = new Set<string>(data.instances?.map((i: EC2Instance) => i.instanceId) || [])
      setExpandedInstances(allInstanceIds)
    } catch (err) {
      console.error("Error loading instances:", err)
      setEc2Instances([])
    } finally {
      setScanning(false)
      setLoading(false)
    }
  }

  const toggleExpanded = (instanceId: string) => {
    const newExpanded = new Set(expandedInstances)
    if (newExpanded.has(instanceId)) {
      newExpanded.delete(instanceId)
    } else {
      newExpanded.add(instanceId)
    }
    setExpandedInstances(newExpanded)
  }

  const getManagerForInstance = (instanceId: string): Manager | undefined => {
    return managers.find((m) => m.instanceId === instanceId)
  }

  const hasDokploy = (instance: EC2Instance): boolean => {
    return instance.tags?.some((tag) => tag.Key === "Dokploy" && tag.Value === "true") || false
  }

  const getInstanceName = (instance: EC2Instance): string => {
    return instance.tags?.find((tag) => tag.Key === "Name")?.Value || "Unnamed Instance"
  }

  const getStateColor = (state: string) => {
    switch (state) {
      case "running":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "stopped":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "stopping":
      case "shutting-down":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20"
      case "terminated":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      default:
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
    }
  }

  const handleAddSoftware = (instance: EC2Instance) => {
    // Get the manager for this instance to retrieve the keyName
    const manager = getManagerForInstance(instance.instanceId)
    const instanceWithKey = {
      ...instance,
      keyName: manager?.config?.keyName || instance.keyName,
    }
    setSelectedInstanceForSoftware(instanceWithKey)
    setSoftwareModalOpen(true)
  }

  const handleCardClick = async (instance: EC2Instance) => {
    // Check if Dokploy is already installed
    if (hasDokploy(instance)) {
      toast({
        title: "Dokploy Already Installed",
        description: "Dokploy is already installed on this instance. Use the Admin Dashboard button to access it.",
      })
      return
    }

    // Check if instance is running
    if (instance.state !== "running") {
      toast({
        title: "Instance Not Running",
        description: "The instance must be running to install Dokploy. Please start the instance first.",
        variant: "destructive",
      })
      return
    }

    // Check if there's an active installation
    if (installations.has(instance.instanceId)) {
      toast({
        title: "Installation In Progress",
        description: "An installation is already in progress for this instance.",
      })
      return
    }

    // Check for public IP
    if (!instance.publicIp) {
      toast({
        title: "No Public IP",
        description: "Instance doesn't have a public IP address yet",
        variant: "destructive",
      })
      return
    }

    // Get SSH key name from manager or instance
    const manager = getManagerForInstance(instance.instanceId)
    const keyName = manager?.config?.keyName || instance.keyName

    if (!keyName) {
      toast({
        title: "No SSH Key",
        description: "Instance doesn't have an SSH key associated. Please add software through the + button instead.",
        variant: "destructive",
      })
      return
    }

    // Confirm installation
    if (!confirm(`Install Dokploy on ${getInstanceName(instance)}?\n\nThis will install Dokploy and make it available at http://${instance.publicIp}:3000`)) {
      return
    }

    // Import SSH key utils dynamically (client-side only)
    const { getSSHKey } = await import("@/lib/ssh-key-utils")

    // Get SSH key from localStorage
    const sshKey = getSSHKey(keyName)
    if (!sshKey) {
      toast({
        title: "SSH Key Not Found",
        description: "SSH key not found in localStorage. Cannot connect to instance.",
        variant: "destructive",
      })
      return
    }

    // Start installation
    setActionLoading({ instanceId: instance.instanceId, action: "install-dokploy" })

    // Track installation as in progress
    startInstallationTracking(instance.instanceId, "", "Dokploy", instance.region)

    try {
      const response = await fetch("/api/instances/install-software-ssh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instanceId: instance.instanceId,
          publicIp: instance.publicIp,
          keyName: keyName,
          privateKey: sshKey.privateKey,
          installDokploy: true,
          dokployApiKey: "",
          installDevToolsShell: false,
          dockerServices: [],
          githubRepos: [],
          customScript: "",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error === "SSH_CONNECTION_FAILED") {
          toast({
            title: "SSH Connection Failed",
            description: data.message,
            variant: "destructive",
          })
          // Remove from installation tracking
          setInstallations((prev) => {
            const newMap = new Map(prev)
            newMap.delete(instance.instanceId)
            return newMap
          })
          return
        }
        throw new Error(data.error || "Failed to install Dokploy")
      }

      if (data.success) {
        toast({
          title: "Dokploy Installation Complete",
          description: (
            <div className="space-y-2">
              <p>Dokploy installed successfully via SSH</p>
              <a
                href={`http://${instance.publicIp}:3000`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-primary hover:underline font-medium"
              >
                Open Dokploy Dashboard →
              </a>
            </div>
          ),
        })

        // Remove from installation tracking
        setInstallations((prev) => {
          const newMap = new Map(prev)
          newMap.delete(instance.instanceId)
          return newMap
        })

        // Refresh instances to update tags
        setTimeout(() => {
          loadAllRegionsInstances()
        }, 2000)
      } else {
        toast({
          title: "Installation Failed",
          description: data.message || "Failed to install Dokploy on the instance.",
          variant: "destructive",
        })
        // Remove from installation tracking
        setInstallations((prev) => {
          const newMap = new Map(prev)
          newMap.delete(instance.instanceId)
          return newMap
        })
      }
    } catch (error) {
      console.error("[SSH] Dokploy install error:", error)
      toast({
        title: "Installation Failed",
        description: error instanceof Error ? error.message : "Failed to install Dokploy",
        variant: "destructive",
      })
      // Remove from installation tracking
      setInstallations((prev) => {
        const newMap = new Map(prev)
        newMap.delete(instance.instanceId)
        return newMap
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleInstanceAction = async (instance: EC2Instance, action: string) => {
    setActionLoading({ instanceId: instance.instanceId, action })

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }

      if (credentials.accessKeyId !== "server-env" && credentials.secretAccessKey !== "server-env") {
        headers["x-aws-access-key-id"] = credentials.accessKeyId
        headers["x-aws-secret-access-key"] = credentials.secretAccessKey
      }
      headers["x-aws-region"] = instance.region

      const response = await fetch("/api/instances", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action,
          instanceId: instance.instanceId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || `Failed to ${action} instance`)
      }

      toast({
        title: `Instance ${action === "terminate" ? "Terminated" : action === "reboot" ? "Rebooting" : action === "start" ? "Started" : "Stopped"}`,
        description: `Instance ${instance.instanceId} action completed`,
      })

      // Refresh instances after action
      setTimeout(() => {
        loadAllRegionsInstances()
      }, 2000)
    } catch (error) {
      toast({
        title: "Action Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleTerminate = (instance: EC2Instance) => {
    if (
      confirm(
        "Are you sure? This will permanently delete the instance and release its Elastic IP. This cannot be undone!",
      )
    ) {
      handleInstanceAction(instance, "terminate")
    }
  }

  const startInstallationTracking = (instanceId: string, commandId: string, installing: string, region: string) => {
    const newInstallation: InstallationState = {
      commandId,
      status: "InProgress",
      installing,
      instanceId,
      region,
    }

    setInstallations((prev) => new Map(prev).set(instanceId, newInstallation))
  }

  const checkInstallationStatus = async (installation: InstallationState) => {
    // Skip SSM polling for SSH installations (no commandId)
    if (!installation.commandId) {
      return
    }

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }

      if (credentials.accessKeyId !== "server-env" && credentials.secretAccessKey !== "server-env") {
        headers["x-aws-access-key-id"] = credentials.accessKeyId
        headers["x-aws-secret-access-key"] = credentials.secretAccessKey
      }
      headers["x-aws-region"] = installation.region

      const response = await fetch("/api/instances/installation-status", {
        method: "POST",
        headers,
        body: JSON.stringify({
          commandId: installation.commandId,
          instanceId: installation.instanceId,
          region: installation.region,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to check installation status")
      }

      const data = await response.json()

      // Update installation state
      setInstallations((prev) => {
        const newMap = new Map(prev)
        const current = newMap.get(installation.instanceId)
        if (current) {
          current.status = data.status
          newMap.set(installation.instanceId, current)
        }
        return newMap
      })

      // If completed, show toast and remove from tracking
      if (data.status === "Success") {
        // Find the instance to get its public IP
        const instance = ec2Instances.find((i) => i.instanceId === installation.instanceId)
        const isDokploy = installation.installing.toLowerCase().includes("dokploy")

        if (isDokploy && instance?.publicIp) {
          const dokployUrl = `http://${instance.publicIp}:3000`
          toast({
            title: "Dokploy Installation Complete",
            description: (
              <div className="space-y-2">
                <p>Dokploy installed successfully on {installation.instanceId}</p>
                <a
                  href={dokployUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-primary hover:underline font-medium"
                >
                  Open Dokploy Dashboard →
                </a>
              </div>
            ),
          })
        } else {
          toast({
            title: "Installation Complete",
            description: `${installation.installing} installed successfully on ${installation.instanceId}`,
          })
        }

        setInstallations((prev) => {
          const newMap = new Map(prev)
          newMap.delete(installation.instanceId)
          return newMap
        })

        // Refresh instances to update tags (especially Dokploy tag)
        if (isDokploy) {
          setTimeout(() => {
            loadAllRegionsInstances()
          }, 2000)
        }
      } else if (data.status === "Failed" || data.status === "Cancelled" || data.status === "TimedOut") {
        toast({
          title: "Installation Failed",
          description: `Failed to install ${installation.installing}: ${data.statusDetails || data.status}`,
          variant: "destructive",
        })
        setInstallations((prev) => {
          const newMap = new Map(prev)
          newMap.delete(installation.instanceId)
          return newMap
        })
      }
    } catch (error) {
      console.error("[SSM] Error checking installation status:", error)
    }
  }

  // Poll for installation status
  useEffect(() => {
    if (installations.size === 0) return

    const interval = setInterval(() => {
      installations.forEach((installation) => {
        if (installation.status === "InProgress") {
          checkInstallationStatus(installation)
        }
      })
    }, 5000) // Poll every 5 seconds

    return () => clearInterval(interval)
  }, [installations])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">EC2 Instances</h3>
          <p className="text-sm text-muted-foreground">
            {ec2Instances.length} instances found across {new Set(ec2Instances.map((i) => i.region)).size} regions
          </p>
        </div>
        <Button onClick={loadAllRegionsInstances} disabled={scanning} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${scanning ? "animate-spin" : ""}`} />
          Scan All Regions
        </Button>
      </div>

      {/* EC2 Instances */}
      {ec2Instances.length === 0 ? (
        <Alert>
          <Server className="h-4 w-4" />
          <AlertDescription>No EC2 instances found across all regions.</AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4">
          {ec2Instances.map((instance) => {
            const manager = getManagerForInstance(instance.instanceId)
            const isExpanded = expandedInstances.has(instance.instanceId)
            const instanceName = getInstanceName(instance)
            const dokploy = hasDokploy(instance)
            const isLoading = actionLoading?.instanceId === instance.instanceId
            const installationState = installations.get(instance.instanceId)

            return (
              <Card
                key={instance.instanceId}
                className="overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => handleCardClick(instance)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-lg">{instanceName}</CardTitle>
                        <Badge
                          variant="outline"
                          className="bg-orange-500/10 text-orange-500 border-orange-500/20 font-mono text-xs"
                        >
                          {instance.instanceId}
                        </Badge>
                        <Badge variant="outline" className="bg-cyan-500/10 text-cyan-500 border-cyan-500/20 text-xs">
                          <Globe className="h-3 w-3 mr-1" />
                          {instance.region}
                        </Badge>
                        {instance.publicIp && (
                          <Badge
                            variant="outline"
                            className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-mono cursor-pointer hover:bg-blue-500/20 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(`http://${instance.publicIp}`, "_blank")
                            }}
                            title="Click to open in browser"
                          >
                            {instance.publicIp}
                          </Badge>
                        )}
                        {instance.instanceType && (
                          <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                            <Cpu className="h-3 w-3 mr-1" />
                            {instance.instanceType}
                          </Badge>
                        )}
                        <Badge variant="outline" className={getStateColor(instance.state)}>
                          {instance.state}
                        </Badge>
                        {dokploy && (
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                            Dokploy
                          </Badge>
                        )}
                        {installationState && (
                          <Badge
                            variant="outline"
                            className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 animate-pulse"
                          >
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Installing: {installationState.installing}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {instance.state === "running" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleInstanceAction(instance, "reboot")
                            }}
                            disabled={isLoading}
                            title="Restart"
                          >
                            {isLoading && actionLoading?.action === "reboot" ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RotateCw className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleInstanceAction(instance, "stop")
                            }}
                            disabled={isLoading}
                            title="Stop"
                          >
                            {isLoading && actionLoading?.action === "stop" ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </Button>
                        </>
                      )}
                      {instance.state === "stopped" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleInstanceAction(instance, "start")
                          }}
                          disabled={isLoading}
                          title="Start"
                        >
                          {isLoading && actionLoading?.action === "start" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      {(instance.state === "running" || instance.state === "stopped") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleTerminate(instance)
                          }}
                          disabled={isLoading}
                          title="Terminate"
                          className="text-destructive hover:text-destructive"
                        >
                          {isLoading && actionLoading?.action === "terminate" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAddSoftware(instance)
                        }}
                        disabled={instance.state !== "running" || isLoading || !!installationState}
                        title="Add Software"
                      >
                        {installationState ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <PackagePlus className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {dokploy && instance.publicIp && instance.state === "running" && (
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(`http://${instance.publicIp}:3000`, "_blank")
                      }}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Admin Dashboard
                    </Button>
                  )}

                  {/* Manager Info */}
                  {manager && (
                    <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                      <div className="text-sm font-medium mb-2">Associated Manager: {manager.name}</div>
                      <InstanceControls
                        manager={manager}
                        apiUrl="/api/instances"
                        credentials={credentials}
                        onUpdate={loadAllRegionsInstances}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Managers without instances */}
      {managers.filter((m) => !m.instanceId || !ec2Instances.find((i) => i.instanceId === m.instanceId)).length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Managers (No Active Instance)</h3>
          {managers
            .filter((m) => !m.instanceId || !ec2Instances.find((i) => i.instanceId === m.instanceId))
            .map((manager) => (
              <Card key={manager.id}>
                <CardHeader>
                  <CardTitle>{manager.name}</CardTitle>
                  <CardDescription>Ready to launch</CardDescription>
                </CardHeader>
                <CardContent>
                  <InstanceControls
                    manager={manager}
                    apiUrl="/api/instances"
                    credentials={credentials}
                    onUpdate={loadAllRegionsInstances}
                  />
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Software Installation Modal */}
      {selectedInstanceForSoftware && (
        <AddSoftwareModal
          open={softwareModalOpen}
          onOpenChange={setSoftwareModalOpen}
          instance={selectedInstanceForSoftware}
          credentials={credentials}
          onInstallationStart={startInstallationTracking}
        />
      )}
    </div>
  )
}
