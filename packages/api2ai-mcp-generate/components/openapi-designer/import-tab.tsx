'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useOpenAPI, parseSpec, isValidOpenAPI3, isSwagger2, convertSwagger2ToOpenAPI3 } from '@/lib/openapi';
import { Upload, FileJson, Trash2, Play, ShoppingCart, Cloud, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { demoSpecs, DemoSpecKey } from '@/lib/openapi/demo-specs';

export function ImportTab() {
  const { spec, dispatch, save } = useOpenAPI();
  const [importText, setImportText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleImport = async () => {
    if (!importText.trim()) {
      toast.error('Please enter an OpenAPI definition to import');
      return;
    }

    setIsLoading(true);
    try {
      const parsed = await parseSpec(importText);

      if (isValidOpenAPI3(parsed)) {
        dispatch({ type: 'SET_SPEC', payload: parsed });
        toast.success('OpenAPI 3.x definition imported successfully');
      } else if (isSwagger2(parsed)) {
        // Auto-convert Swagger 2.0 to OpenAPI 3.0
        const converted = convertSwagger2ToOpenAPI3(parsed as Record<string, unknown>);
        dispatch({ type: 'SET_SPEC', payload: converted });
        toast.success('Swagger 2.0 converted to OpenAPI 3.0 and imported');
      } else {
        toast.error('Invalid OpenAPI specification. Must be OpenAPI 3.x or Swagger 2.0.');
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to parse definition. Check the format and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDemo = (demoKey: DemoSpecKey) => {
    save();
    const demo = demoSpecs[demoKey];
    dispatch({ type: 'SET_SPEC', payload: demo.spec });
    toast.success(`${demo.name} loaded successfully`);
  };

  const getDemoIcon = (demoKey: DemoSpecKey) => {
    const icons = {
      petstore: Play,
      ecommerce: ShoppingCart,
      weather: Cloud,
      userManagement: Users,
    };
    return icons[demoKey];
  };

  const removeAllPaths = () => {
    if (confirm('Are you sure you want to remove all paths?')) {
      save();
      dispatch({ type: 'REMOVE_ALL_PATHS' });
      toast.info('All paths removed');
    }
  };

  const resetSpec = () => {
    if (confirm('Are you sure you want to reset to an empty spec? This will remove all data.')) {
      save();
      dispatch({ type: 'RESET_SPEC' });
      toast.info('Spec reset to empty');
    }
  };

  const currentSpecJson = JSON.stringify(spec, null, 2);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Import Definition</h2>
          <p className="text-muted-foreground">
            Upload an existing OpenAPI 3.x definition in JSON or YAML format
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Paste Definition</CardTitle>
              <CardDescription>
                Enter your OpenAPI 3.x specification in JSON or YAML format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={`Paste your OpenAPI 3.x definition here...

{
  "openapi": "3.0.3",
  "info": {
    "title": "My API",
    "version": "1.0.0"
  },
  "paths": {}
}

Or YAML format:

openapi: "3.0.3"
info:
  title: My API
  version: "1.0.0"
paths: {}`}
                className="min-h-[400px] font-mono text-sm"
              />
              <div className="flex gap-2">
                <Button onClick={handleImport} disabled={isLoading}>
                  <Upload className="h-4 w-4 mr-2" />
                  {isLoading ? 'Importing...' : 'Load Definition'}
                </Button>
                <Button variant="outline" onClick={() => setImportText(currentSpecJson)}>
                  <FileJson className="h-4 w-4 mr-2" />
                  Load Current
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Demo Examples</CardTitle>
              <CardDescription>
                Load pre-built API specifications to get started quickly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(demoSpecs).map(([key, demo]) => {
                const Icon = getDemoIcon(key as DemoSpecKey);
                return (
                  <Button
                    key={key}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => loadDemo(key as DemoSpecKey)}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{demo.name}</span>
                      <span className="text-xs text-muted-foreground">{demo.description}</span>
                    </div>
                  </Button>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={removeAllPaths}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove All Paths
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={resetSpec}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Reset to Empty
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Spec Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Title:</span>
                <span className="font-medium">{spec.info?.title || 'Untitled'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version:</span>
                <span className="font-mono">{spec.info?.version || '0.0.0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">OpenAPI:</span>
                <span className="font-mono">{spec.openapi}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paths:</span>
                <span>{Object.keys(spec.paths || {}).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Schemas:</span>
                <span>{Object.keys(spec.components?.schemas || {}).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tags:</span>
                <span>{spec.tags?.length || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
