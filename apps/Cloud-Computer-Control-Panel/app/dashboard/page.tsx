"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Server, Activity, Settings, BookOpen } from "lucide-react"
import { ManagerList } from "@/components/dashboard/manager-list"
import { CreateManager } from "@/components/instance/create-manager"
import { CredentialsSettings } from "@/components/dashboard/credentials-settings"

export default function DashboardPage() {
  const router = useRouter()
  const [credentials, setCredentials] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("managers")
  const [showSettings, setShowSettings] = useState(false)
  const [managers, setManagers] = useState<any[]>([])

  useEffect(() => {
    const checkCredentials = async () => {
      const storedCreds = localStorage.getItem("awsCredentials") || sessionStorage.getItem("awsCredentials")
      if (!storedCreds) {
        router.push("/")
        return
      }

      try {
        setCredentials(JSON.parse(storedCreds))
      } catch (err) {
        console.error("Failed to parse credentials:", err)
        router.push("/")
      }
    }

    checkCredentials()
  }, [router])

  useEffect(() => {
    const loadManagers = () => {
      const stored = localStorage.getItem("awsManagers")
      if (stored) {
        try {
          setManagers(JSON.parse(stored))
        } catch (err) {
          console.error("Failed to load managers:", err)
        }
      }
    }

    loadManagers()
    const interval = setInterval(loadManagers, 2000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = () => {
    sessionStorage.removeItem("awsCredentials")
    localStorage.removeItem("awsCredentials")
    router.push("/")
  }

  if (!credentials) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/apple-touch-icon.png" alt="CCCP" className="h-10 w-10 rounded-lg" />
              <div>
                <h1 className="text-2xl font-bold">CCCP Cloud Computer Control Panel</h1>
                <p className="text-sm text-muted-foreground">Manage your own personal cloud with fully self-hosted cloud applications using Dokploy</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open("/api-reference", "_blank")}
                className="hidden md:flex"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                API Docs
              </Button>
              <Button variant="outline" size="icon" onClick={() => setShowSettings(!showSettings)}>
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          {showSettings && (
            <CredentialsSettings
              credentials={credentials}
              onUpdate={(newCreds) => {
                setCredentials(newCreds)
                sessionStorage.setItem("awsCredentials", JSON.stringify(newCreds))
                setShowSettings(false)
              }}
              onClose={() => setShowSettings(false)}
              onDisconnect={handleLogout}
            />
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="managers">
                <Activity className="h-4 w-4 mr-2" />
                Managers
              </TabsTrigger>
              <TabsTrigger value="create">
                <Plus className="h-4 w-4 mr-2" />
                Create New
              </TabsTrigger>
            </TabsList>

            <TabsContent value="managers" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>EC2 Instance Managers</CardTitle>
                  <CardDescription>Manage your EC2 instances with automated Dokploy installation</CardDescription>
                </CardHeader>
                <CardContent>
                  <ManagerList credentials={credentials} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="create" className="space-y-6">
              <CreateManager credentials={credentials} onSuccess={() => setActiveTab("managers")} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
