"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, TrendingUp, TrendingDown, PieChart, Calculator } from "lucide-react"

interface CostEstimatorProps {
  managers: any[]
}

export function CostEstimator({ managers }: CostEstimatorProps) {
  const calculateTotalCosts = () => {
    return managers.reduce((total, manager) => {
      const cost = manager.costEstimate?.estimatedMonthlyCost?.total || 0
      return total + cost
    }, 0)
  }

  const calculateCostsByType = () => {
    const costsByType: { [key: string]: number } = {}
    managers.forEach((manager) => {
      const type = manager.config.instanceType
      const cost = manager.costEstimate?.estimatedMonthlyCost?.total || 0
      costsByType[type] = (costsByType[type] || 0) + cost
    })
    return costsByType
  }

  const calculateCostsByRegion = () => {
    const costsByRegion: { [key: string]: number } = {}
    managers.forEach((manager) => {
      const region = manager.config.region
      const cost = manager.costEstimate?.estimatedMonthlyCost?.total || 0
      costsByRegion[region] = (costsByRegion[region] || 0) + cost
    })
    return costsByRegion
  }

  const getRunningCosts = () => {
    return managers
      .filter((m) => m.status?.state === "running")
      .reduce((total, manager) => {
        const cost = manager.costEstimate?.estimatedMonthlyCost?.total || 0
        return total + cost
      }, 0)
  }

  const totalCost = calculateTotalCosts()
  const runningCost = getRunningCosts()
  const costsByType = calculateCostsByType()
  const costsByRegion = calculateCostsByRegion()
  const potentialSavings = totalCost - runningCost

  return (
    <div className="space-y-6">
      {/* Cost Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Monthly Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All instances if running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Running Cost</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${runningCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Only running instances</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Savings</CardTitle>
            <TrendingDown className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${potentialSavings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From stopped instances</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Efficiency</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalCost > 0 ? Math.round((potentialSavings / totalCost) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Savings percentage</p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Breakdown by Instance Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Cost Breakdown by Instance Type
          </CardTitle>
          <CardDescription>Monthly cost distribution across different instance types</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(costsByType).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(costsByType)
                .sort(([, a], [, b]) => b - a)
                .map(([type, cost]) => {
                  const percentage = totalCost > 0 ? (cost / totalCost) * 100 : 0
                  return (
                    <div key={type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{type}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {managers.filter((m) => m.config.instanceType === type).length} instance(s)
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">${cost.toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  )
                })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No cost data available</div>
          )}
        </CardContent>
      </Card>

      {/* Cost Breakdown by Region */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Cost Breakdown by Region
          </CardTitle>
          <CardDescription>Monthly cost distribution across AWS regions</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(costsByRegion).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(costsByRegion)
                .sort(([, a], [, b]) => b - a)
                .map(([region, cost]) => {
                  const percentage = totalCost > 0 ? (cost / totalCost) * 100 : 0
                  return (
                    <div key={region} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{region}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {managers.filter((m) => m.config.region === region).length} instance(s)
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">${cost.toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  )
                })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No cost data available</div>
          )}
        </CardContent>
      </Card>

      {/* Individual Instance Costs */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Instance Costs</CardTitle>
          <CardDescription>Detailed cost breakdown for each managed instance</CardDescription>
        </CardHeader>
        <CardContent>
          {managers.length > 0 ? (
            <div className="space-y-4">
              {managers.map((manager) => {
                const cost = manager.costEstimate?.estimatedMonthlyCost
                const isRunning = manager.status?.state === "running"
                return (
                  <div key={manager.managerId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">{manager.config.instanceName || "Unnamed Instance"}</div>
                      <div className="text-sm text-muted-foreground">
                        {manager.config.instanceType} • {manager.config.region} • {manager.config.storageSize}GB
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={isRunning ? "default" : "secondary"}>
                          {manager.status?.state || "Not launched"}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${cost?.total?.toFixed(2) || "0.00"}/mo</div>
                      <div className="text-xs text-muted-foreground">
                        Compute: ${cost?.compute?.toFixed(2) || "0.00"} • Storage: $
                        {cost?.storage?.toFixed(2) || "0.00"}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No instances to display</div>
          )}
        </CardContent>
      </Card>

      {/* Cost Optimization Tips */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Cost Optimization Tips</CardTitle>
          <CardDescription>Ways to reduce your AWS EC2 costs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Stop Unused Instances</h4>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Stop instances when not in use to save ~70% on compute costs. You only pay for storage when stopped.
              </p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Right-size Your Instances</h4>
              <p className="text-sm text-green-800 dark:text-green-200">
                Choose the appropriate instance type for your workload. Start small and scale up as needed.
              </p>
            </div>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">Use Spot Instances</h4>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                For non-critical workloads, consider Spot instances which can be up to 90% cheaper.
              </p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Monitor and Set Alerts</h4>
              <p className="text-sm text-purple-800 dark:text-purple-200">
                Set up billing alerts in AWS Console to get notified when costs exceed your budget.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
