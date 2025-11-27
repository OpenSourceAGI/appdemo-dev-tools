"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { subscription } from "@/lib/auth";

interface SubscriptionData {
  id: string;
  plan: string;
  status: string;
  periodStart: string;
  periodEnd: string;
  cancelAtPeriodEnd: boolean;
  seats?: number;
  trialStart?: string;
  trialEnd?: string;
  limits?: Record<string, number>;
}

export function SubscriptionManager() {
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      const { data, error } = await subscription.list({});
      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to load subscriptions",
          variant: "destructive",
        });
        return;
      }
      setSubscriptions(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load subscriptions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    try {
      const { error } = await subscription.cancel({
        subscriptionId,
        returnUrl: window.location.href,
      });
      
      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to cancel subscription",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Success",
        description: "Subscription cancellation initiated. You'll be redirected to manage your subscription.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    }
  };

  const handleRestoreSubscription = async (subscriptionId: string) => {
    try {
      const { error } = await subscription.restore({
        subscriptionId,
      });
      
      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to restore subscription",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Success",
        description: "Subscription restored successfully",
      });
      loadSubscriptions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to restore subscription",
        variant: "destructive",
      });
    }
  };

  const handleBillingPortal = async () => {
    try {
      const { data, error } = await subscription.billingPortal({
        returnUrl: window.location.href,
      });
      
      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to open billing portal",
          variant: "destructive",
        });
        return;
      }
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to open billing portal",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading subscriptions...</div>
        </CardContent>
      </Card>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Subscriptions</CardTitle>
          <CardDescription>
            You don't have any active subscriptions. Visit our pricing page to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <a href="/pricing">View Pricing Plans</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {subscriptions.map((sub) => (
        <Card key={sub.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="capitalize">{sub.plan} Plan</CardTitle>
                <CardDescription>
                  {sub.seats && `${sub.seats} seats`}
                  {sub.limits && Object.entries(sub.limits).map(([key, value]) => (
                    <span key={key} className="ml-2">
                      {key}: {value}
                    </span>
                  ))}
                </CardDescription>
              </div>
              <Badge 
                variant={
                  sub.status === "active" ? "default" : 
                  sub.status === "trialing" ? "secondary" : 
                  "destructive"
                }
              >
                {sub.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                <div>Period: {new Date(sub.periodStart).toLocaleDateString()} - {new Date(sub.periodEnd).toLocaleDateString()}</div>
                {sub.trialStart && sub.trialEnd && (
                  <div>Trial: {new Date(sub.trialStart).toLocaleDateString()} - {new Date(sub.trialEnd).toLocaleDateString()}</div>
                )}
                {sub.cancelAtPeriodEnd && (
                  <div className="text-orange-600">Cancels at period end</div>
                )}
              </div>
              
              <div className="flex gap-2">
                {sub.status === "active" && !sub.cancelAtPeriodEnd && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleCancelSubscription(sub.id)}
                  >
                    Cancel Subscription
                  </Button>
                )}
                
                {sub.status === "active" && sub.cancelAtPeriodEnd && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleRestoreSubscription(sub.id)}
                  >
                    Restore Subscription
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleBillingPortal}
                >
                  Manage Billing
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
