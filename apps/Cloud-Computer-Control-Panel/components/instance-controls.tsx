"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Play,
  Square,
  Trash2,
  Rocket,
  Terminal,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  RotateCw,
  Code,
  Camera,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { storeSSHKey } from "@/lib/ssh-key-utils"

interface InstanceControlsProps {
  manager: any
  apiUrl: string
  credentials: any
  onUpdate: (manager: any) => void
}

export function InstanceControls({ manager, apiUrl, credentials, onUpdate }: InstanceControlsProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [customScript, setCustomScript] = useState("")
  const [scriptFilename, setScriptFilename] = useState("custom-script.sh")
  const [snapshotDescription, setSnapshotDescription] = useState("")
  const { toast } = useToast()

  const apiCall = async (action: string, body?: any) => {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        region: credentials.region,
        action,
        instanceId: manager.status?.instanceId,
        config: manager.config,
        ...body,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    return response.json()
  }

  const launchInstance = async () => {
    setLoading("launch")
    console.log("[v0] Launch button clicked")
    const sanitizedConfig = {
      ...manager.config,
    }
    // Only include keyName if it has a valid value
    if (manager.config.keyName && manager.config.keyName.trim() !== "") {
      sanitizedConfig.keyName = manager.config.keyName.trim()
    } else {
      delete sanitizedConfig.keyName
    }
    console.log("[v0] Manager config (sanitized):", sanitizedConfig)
    console.log("[v0] Credentials:", {
      hasAccessKey: !!credentials.accessKeyId,
      region: credentials.region,
    })

    try {
      console.log("[v0] Calling API...")
      const response = await fetch("/api/servers/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          region: credentials.region,
          config: sanitizedConfig,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || `HTTP ${response.status}`)
      }

      const result = await response.json()
      console.log("[v0] Launch result:", result)

      // Store SSH key in localStorage if provided
      if (result.sshKey) {
        storeSSHKey(result.sshKey.keyName, {
          privateKey: result.sshKey.privateKey,
          publicKey: result.sshKey.publicKey,
          fingerprint: result.sshKey.fingerprint,
        })
        console.log("[v0] SSH key stored in localStorage:", result.sshKey.keyName)
      }

      onUpdate({
        ...manager,
        config: {
          ...sanitizedConfig,
          keyName: result.sshKey?.keyName || sanitizedConfig.keyName,
        },
        status: {
          state: "pending",
          instanceId: result.instanceId,
          publicIp: result.elasticIp,
          allocationId: result.allocationId,
        },
      })
      toast({
        title: "Instance Launched",
        description: `Instance ${result.instanceId} is starting with Elastic IP ${result.elasticIp || "pending"}`,
      })
    } catch (error) {
      console.error("[v0] Launch error:", error)
      toast({
        title: "Launch Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const startInstance = async () => {
    if (!manager.status?.instanceId) {
      toast({
        title: "No Instance",
        description: "Please launch an instance first",
        variant: "destructive",
      })
      return
    }

    setLoading("start")
    try {
      await apiCall("start")
      onUpdate({ ...manager, status: { ...manager.status, state: "running" } })
      toast({
        title: "Instance Started",
        description: "Instance is now running",
      })
    } catch (error) {
      toast({
        title: "Start Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const stopInstance = async () => {
    if (!manager.status?.instanceId) {
      toast({
        title: "No Instance",
        description: "No instance to stop",
        variant: "destructive",
      })
      return
    }

    setLoading("stop")
    try {
      await apiCall("stop")
      onUpdate({ ...manager, status: { ...manager.status, state: "stopped" } })
      toast({
        title: "Instance Stopped",
        description: "Instance has been stopped to save costs",
      })
    } catch (error) {
      toast({
        title: "Stop Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const terminateInstance = async () => {
    if (!manager.status?.instanceId) {
      toast({
        title: "No Instance",
        description: "No instance to terminate",
        variant: "destructive",
      })
      return
    }

    if (
      !confirm(
        "Are you sure? This will permanently delete the instance and release its Elastic IP. This cannot be undone!",
      )
    ) {
      return
    }

    setLoading("terminate")
    try {
      await apiCall("terminate")
      onUpdate({ ...manager, status: { ...manager.status, state: "terminated" } })
      toast({
        title: "Instance Terminated",
        description: "Instance terminated and Elastic IP released",
        variant: "destructive",
      })
    } catch (error) {
      toast({
        title: "Termination Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const refreshStatus = async () => {
    if (!manager.status?.instanceId) {
      return
    }

    setLoading("refresh")
    try {
      const response = await fetch(
        `${apiUrl}?${new URLSearchParams({
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          region: credentials.region,
        })}`,
      )
      const data = await response.json()

      if (response.ok && data.instances) {
        const instance = data.instances.find((inst: any) => inst.instanceId === manager.status.instanceId)
        if (instance) {
          onUpdate({
            ...manager,
            status: {
              ...manager.status,
              state: instance.state,
              publicIp: instance.publicIp,
              privateIp: instance.privateIp,
            },
          })
          toast({
            title: "Status Updated",
            description: `Instance is ${instance.state}`,
          })
        }
      }
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const rebootInstance = async () => {
    if (!manager.status?.instanceId) {
      toast({
        title: "No Instance",
        description: "No instance to reboot",
        variant: "destructive",
      })
      return
    }

    if (!confirm("This will stop and restart the instance. Continue?")) {
      return
    }

    setLoading("reboot")
    try {
      await apiCall("reboot")
      onUpdate({ ...manager, status: { ...manager.status, state: "stopping" } })
      toast({
        title: "Instance Rebooting",
        description: "Instance is being stopped and will restart automatically",
      })

      // Poll for running status after reboot
      setTimeout(() => {
        refreshStatus()
      }, 30000) // Check after 30 seconds
    } catch (error) {
      toast({
        title: "Reboot Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const setupDevEnvironment = async () => {
    if (!manager.status?.instanceId) {
      toast({
        title: "No Instance",
        description: "Please launch an instance first",
        variant: "destructive",
      })
      return
    }

    setLoading("setup")
    try {
      await apiCall("setup-dev")
      toast({
        title: "Development Environment",
        description: "Dev tools setup completed successfully",
      })
    } catch (error) {
      toast({
        title: "Setup Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const createSnapshot = async () => {
    if (!manager.status?.instanceId) {
      toast({
        title: "No Instance",
        description: "No instance to snapshot",
        variant: "destructive",
      })
      return
    }

    setLoading("snapshot")
    try {
      await apiCall("snapshot", {
        description: snapshotDescription || `Snapshot created at ${new Date().toISOString()}`,
      })
      toast({
        title: "Snapshot Created",
        description: "Volume snapshots created successfully",
      })
      setSnapshotDescription("")
    } catch (error) {
      toast({
        title: "Snapshot Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const executeScript = async () => {
    if (!customScript.trim()) {
      toast({
        title: "No Script",
        description: "Please enter a script to execute",
        variant: "destructive",
      })
      return
    }

    setLoading("script")
    try {
      await apiCall("execute-script", {
        script: customScript,
        filename: scriptFilename,
      })
      toast({
        title: "Script Executed",
        description: "Script completed successfully",
      })
    } catch (error) {
      toast({
        title: "Script Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  const getStateIcon = (state: string) => {
    switch (state) {
      case "running":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "stopped":
        return <Square className="h-4 w-4 text-yellow-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "terminated":
        return <Trash2 className="h-4 w-4 text-red-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Instance Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Instance Status</span>
            <Button variant="outline" size="sm" onClick={refreshStatus} disabled={loading === "refresh"}>
              <RefreshCw className={`h-4 w-4 ${loading === "refresh" ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {manager.status?.instanceId ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getStateIcon(manager.status.state)}
                <Badge variant="secondary" className="text-sm">
                  {manager.status.state?.toUpperCase() || "UNKNOWN"}
                </Badge>
                <span className="text-sm text-muted-foreground font-mono">{manager.status.instanceId}</span>
              </div>

              {manager.status.publicIp && (
                <Alert>
                  <Terminal className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div>
                        <strong>Public IP (Static):</strong> {manager.status.publicIp}
                      </div>
                      {manager.status.privateIp && (
                        <div>
                          <strong>Private IP:</strong> {manager.status.privateIp}
                        </div>
                      )}
                      {manager.config.keyName && manager.config.keyName.trim() !== "" && (
                        <>
                          <div>
                            <strong>SSH Command:</strong>
                          </div>
                          <code className="block text-xs bg-muted p-2 rounded mt-1">
                            ssh -i {manager.config.keyName}.pem ubuntu@{manager.status.publicIp}
                          </code>
                        </>
                      )}
                      {(!manager.config.keyName || manager.config.keyName.trim() === "") && (
                        <>
                          <div>
                            <strong>Connect via AWS Systems Manager:</strong>
                          </div>
                          <code className="block text-xs bg-muted p-2 rounded mt-1">
                            aws ssm start-session --target {manager.status.instanceId}
                          </code>
                        </>
                      )}
                      {manager.config.setupDokploy && (
                        <>
                          <div className="pt-2">
                            <strong>Dokploy Access:</strong>
                          </div>
                          <code className="block text-xs bg-muted p-2 rounded mt-1">
                            http://{manager.status.publicIp}:3000
                          </code>
                        </>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No instance launched yet. Use the Launch button below to create your EC2 instance with Dokploy.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Instance Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Instance Controls</CardTitle>
          <CardDescription>Manage your EC2 instance lifecycle</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Launch Instance */}
            <Button
              onClick={launchInstance}
              disabled={loading === "launch" || manager.status?.state === "running"}
              className="h-auto py-3 flex-col gap-1.5"
              size="sm"
            >
              <Rocket className="h-4 w-4" />
              <span className="text-xs">{loading === "launch" ? "Launching..." : "Launch"}</span>
            </Button>

            {/* Start Instance */}
            <Button
              onClick={startInstance}
              disabled={loading === "start" || manager.status?.state !== "stopped"}
              variant="outline"
              className="h-auto py-3 flex-col gap-1.5 bg-transparent"
              size="sm"
            >
              <Play className="h-4 w-4" />
              <span className="text-xs">{loading === "start" ? "Starting..." : "Start"}</span>
            </Button>

            {/* Stop Instance */}
            <Button
              onClick={stopInstance}
              disabled={loading === "stop" || manager.status?.state !== "running"}
              variant="outline"
              className="h-auto py-3 flex-col gap-1.5 bg-transparent"
              size="sm"
            >
              <Square className="h-4 w-4" />
              <span className="text-xs">{loading === "stop" ? "Stopping..." : "Stop"}</span>
            </Button>

            {/* Reboot Instance */}
            <Button
              onClick={rebootInstance}
              disabled={loading === "reboot" || manager.status?.state !== "running"}
              variant="outline"
              className="h-auto py-3 flex-col gap-1.5 bg-transparent"
              size="sm"
            >
              <RotateCw className={`h-4 w-4 ${loading === "reboot" ? "animate-spin" : ""}`} />
              <span className="text-xs">{loading === "reboot" ? "Rebooting..." : "Reboot"}</span>
            </Button>

            {/* Setup Dev Environment Button */}
            <Button
              onClick={setupDevEnvironment}
              disabled={loading === "setup" || manager.status?.state !== "running"}
              variant="outline"
              className="h-auto py-3 flex-col gap-1.5 bg-transparent"
              size="sm"
            >
              <Code className="h-4 w-4" />
              <span className="text-xs">{loading === "setup" ? "Setting up..." : "Setup Dev"}</span>
            </Button>

            {/* Create Snapshot Button */}
            <Button
              onClick={createSnapshot}
              disabled={loading === "snapshot" || !manager.status?.instanceId}
              variant="outline"
              className="h-auto py-3 flex-col gap-1.5 bg-transparent"
              size="sm"
            >
              <Camera className="h-4 w-4" />
              <span className="text-xs">{loading === "snapshot" ? "Creating..." : "Snapshot"}</span>
            </Button>

            {/* Terminate Instance */}
            <Button
              onClick={terminateInstance}
              disabled={loading === "terminate" || manager.status?.state === "terminated"}
              variant="destructive"
              className="h-auto py-3 flex-col gap-1.5 col-span-2 md:col-span-3 lg:col-span-6"
              size="sm"
            >
              <Trash2 className="h-4 w-4" />
              <span className="text-xs">{loading === "terminate" ? "Terminate" : "Terminate & Release IP"}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {manager.status?.state === "running" && (
        <Card>
          <CardHeader>
            <CardTitle>Execute Custom Script</CardTitle>
            <CardDescription>Run custom bash scripts on your instance via SSH</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="scriptFilename">Script Filename</Label>
              <Input
                id="scriptFilename"
                value={scriptFilename}
                onChange={(e) => setScriptFilename(e.target.value)}
                placeholder="custom-script.sh"
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customScript">Script Content</Label>
              <Textarea
                id="customScript"
                value={customScript}
                onChange={(e) => setCustomScript(e.target.value)}
                placeholder="#!/bin/bash&#10;echo 'Hello from EC2!'&#10;# Add your commands here..."
                rows={8}
                className="font-mono text-sm"
              />
            </div>

            <Button onClick={executeScript} disabled={loading === "script" || !customScript.trim()} className="w-full">
              <Terminal className="h-4 w-4 mr-2" />
              {loading === "script" ? "Executing..." : "Execute Script"}
            </Button>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Scripts will be executed with sudo privileges. Ensure your security group allows SSH (port 22) and you
                have the correct key pair configured.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Snapshot Management Card */}
      {manager.status?.instanceId && (
        <Card>
          <CardHeader>
            <CardTitle>Snapshot Management</CardTitle>
            <CardDescription>Create backups of your instance volumes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="snapshotDescription">Snapshot Description</Label>
              <Input
                id="snapshotDescription"
                value={snapshotDescription}
                onChange={(e) => setSnapshotDescription(e.target.value)}
                placeholder="Backup before deployment"
              />
            </div>

            <Button onClick={createSnapshot} disabled={loading === "snapshot"} className="w-full">
              <Camera className="h-4 w-4 mr-2" />
              {loading === "snapshot" ? "Creating Snapshot..." : "Create Snapshot"}
            </Button>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Snapshots are created for all volumes attached to the instance. They can be used to restore data or
                create new instances from backups.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
