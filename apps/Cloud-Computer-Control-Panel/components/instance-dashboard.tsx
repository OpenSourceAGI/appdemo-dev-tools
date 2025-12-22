"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Server,
  Play,
  Square,
  Trash2,
  RefreshCw,
  ExternalLink,
  DollarSign,
  Clock,
  MapPin,
  HardDrive,
  Shield,
  Terminal,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface InstanceDashboardProps {
  manager: any
  apiUrl: string
  onSelect: () => void
  onDelete: () => void
  onStatusUpdate: () => void
  isActive: boolean
}

export function InstanceDashboard({
  manager,
  apiUrl,
  onSelect,
  onDelete,
  onStatusUpdate,
  isActive,
}: InstanceDashboardProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const getStateColor = (state: string) => {
    switch (state) {
      case "running":
        return "bg-green-500"
      case "stopped":
        return "bg-yellow-500"
      case "pending":
        return "bg-blue-500"
      case "stopping":
        return "bg-orange-500"
      case "terminated":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStateIcon = (state: string) => {
    switch (state) {
      case "running":
        return <Play className="h-4 w-4" />
      case "stopped":
        return <Square className="h-4 w-4" />
      case "pending":
        return <Clock className="h-4 w-4" />
      default:
        return <Server className="h-4 w-4" />
    }
  }

  const refreshStatus = async () => {
    setLoading(true)
    try {
      await onStatusUpdate()
      toast({
        title: "Status Updated",
        description: "Instance status refreshed successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh status",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Auto-refresh status every 30 seconds for active manager
  useEffect(() => {
    if (isActive && manager.status?.instanceId) {
      const interval = setInterval(onStatusUpdate, 30000)
      return () => clearInterval(interval)
    }
  }, [isActive, manager.status?.instanceId, onStatusUpdate])

  return (
    <Card className={`transition-all ${isActive ? "ring-2 ring-blue-500" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Server className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg">{manager.config.instanceName || "Unnamed Instance"}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <span className="text-xs font-mono">{manager.managerId}</span>
                {manager.status?.state && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${getStateColor(manager.status.state)}`} />
                    {manager.status.state}
                  </Badge>
                )}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={refreshStatus} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Instance Details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-muted-foreground" />
            <span>{manager.config.instanceType}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{manager.config.region}</span>
          </div>
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-muted-foreground" />
            <span>{manager.config.storageSize}GB</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>${manager.costEstimate?.estimatedMonthlyCost?.total?.toFixed(2) || "0.00"}/mo</span>
          </div>
        </div>

        {/* Connection Info */}
        {manager.status?.publicIp && (
          <Alert>
            <Terminal className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div>
                  <strong>Public IP:</strong> {manager.status.publicIp}
                </div>
                {manager.config.setupDokploy && (
                  <div className="mt-2">
                    <strong>Dokploy Dashboard:</strong>{" "}
                    <a
                      href={`http://${manager.status.publicIp}:3000`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600 underline inline-flex items-center gap-1"
                    >
                      http://{manager.status.publicIp}:3000
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                <div>
                  <strong>SSH Command:</strong>
                </div>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {manager.config.keyName
                    ? `ssh -i ${manager.config.keyName}.pem ubuntu@${manager.status.publicIp}`
                    : `# Connect via AWS Systems Manager Session Manager`}
                </code>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Security Groups */}
        {manager.config.allowedPorts && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Shield className="h-4 w-4" />
              Allowed Ports
            </div>
            <div className="flex flex-wrap gap-1">
              {manager.config.allowedPorts.map((port: number) => (
                <Badge key={port} variant="outline" className="text-xs">
                  {port}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Development Environment */}
        {manager.config.setupDevEnvironment && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Development Tools</div>
            <div className="flex flex-wrap gap-1">
              {manager.config.devTools?.map((tool: string) => (
                <Badge key={tool} variant="secondary" className="text-xs">
                  {tool}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button onClick={onSelect} variant={isActive ? "default" : "outline"} size="sm" className="flex-1">
            {isActive ? "Selected" : "Select"}
          </Button>
          {manager.status?.publicIp && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`http://${manager.status.publicIp}`, "_blank")}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
