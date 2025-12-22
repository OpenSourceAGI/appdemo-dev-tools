"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Key, ExternalLink, AlertCircle, X, LogOut } from "lucide-react"

interface CredentialsSettingsProps {
  credentials: {
    accessKeyId: string
    secretAccessKey: string
  }
  onUpdate: (credentials: any) => void
  onClose: () => void
  onDisconnect: () => void
}

export function CredentialsSettings({ credentials, onUpdate, onClose, onDisconnect }: CredentialsSettingsProps) {
  const [formData, setFormData] = useState({
    accessKeyId: credentials.accessKeyId === "env" ? "" : credentials.accessKeyId,
    secretAccessKey: credentials.secretAccessKey === "env" ? "" : credentials.secretAccessKey,
  })

  const isUsingEnv = credentials.accessKeyId === "env"

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate(formData)
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            IAM Credentials Management
          </CardTitle>
          <CardDescription>Update your AWS credentials</CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {isUsingEnv && (
          <Alert className="mb-6 bg-green-500/5 border-green-500/20">
            <AlertCircle className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-500">Using Environment Variables</AlertTitle>
            <AlertDescription className="text-sm">
              Currently using AWS credentials from environment variables. You can override them below if needed.
            </AlertDescription>
          </Alert>
        )}

        <Alert className="mb-6 bg-blue-500/5 border-blue-500/20">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          <AlertTitle className="text-blue-500">How to get AWS IAM credentials</AlertTitle>
          <AlertDescription className="space-y-2 mt-2">
            <p className="text-sm">Follow these guides to create or manage your programmatic access credentials:</p>
            <div className="flex flex-col gap-2 mt-2">
              <a
                href="https://www.youtube.com/watch?v=lntWTStctIE"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-500 hover:text-blue-400 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                Video Tutorial: Creating AWS IAM User
              </a>
              <a
                href="https://www.simplified.guide/aws/iam/create-programmatic-access-user"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-500 hover:text-blue-400 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                Step-by-Step Guide: AWS IAM Programmatic Access
              </a>
            </div>
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="accessKeyId">AWS Access Key ID</Label>
            <Input
              id="accessKeyId"
              value={formData.accessKeyId}
              onChange={(e) => setFormData({ ...formData, accessKeyId: e.target.value })}
              placeholder={isUsingEnv ? "Using environment variable" : "AKIAXXXXXXXXXXXXXXXX"}
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="secretAccessKey">AWS Secret Access Key</Label>
            <Input
              id="secretAccessKey"
              type="password"
              value={formData.secretAccessKey}
              onChange={(e) => setFormData({ ...formData, secretAccessKey: e.target.value })}
              placeholder={isUsingEnv ? "Using environment variable" : "Your AWS secret access key"}
              className="font-mono"
            />
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button onClick={handleSubmit} className="flex-1">
          Update Credentials
        </Button>
        <Button variant="destructive" onClick={onDisconnect}>
          <LogOut className="h-4 w-4 mr-2" />
          Disconnect
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </CardFooter>
    </Card>
  )
}
