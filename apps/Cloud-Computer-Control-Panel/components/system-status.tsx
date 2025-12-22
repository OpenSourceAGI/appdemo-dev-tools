"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Activity } from "lucide-react"

export function SystemStatus() {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5" />
          System Status
        </CardTitle>
        <CardDescription>AWS Manager with Dokploy Integration</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <Badge variant="secondary" className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              System Operational
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            Ready to create and manage EC2 instances with automated Dokploy installation
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
