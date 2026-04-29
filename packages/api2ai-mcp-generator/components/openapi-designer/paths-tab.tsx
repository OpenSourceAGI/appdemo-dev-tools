'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { useOpenAPI, type PathItemObject, type HttpMethod, HTTP_METHODS } from '@/lib/openapi';
import { Plus, Trash2, ChevronDown, Copy, Edit, Route } from 'lucide-react';
import { useState } from 'react';
import { OperationEditor } from './operation-editor';

interface PathEditorProps {
  path: string;
  pathItem: PathItemObject;
}

function PathEditor({ path, pathItem }: PathEditorProps) {
  const { dispatch, save } = useOpenAPI();
  const [isOpen, setIsOpen] = useState(true);
  const [localPath, setLocalPath] = useState(path);
  const [showDescription, setShowDescription] = useState(false);

  const operations = HTTP_METHODS.filter((method) => pathItem[method]);

  const handlePathBlur = () => {
    if (localPath !== path && localPath.trim()) {
      dispatch({
        type: 'RENAME_PATH',
        payload: { oldPath: path, newPath: localPath },
      });
    }
  };

  const removePath = () => {
    save();
    dispatch({ type: 'REMOVE_PATH', payload: path });
  };

  const duplicatePath = () => {
    dispatch({ type: 'DUPLICATE_PATH', payload: path });
  };

  const addOperation = () => {
    // Find the first unused HTTP method
    const usedMethods = HTTP_METHODS.filter((m) => pathItem[m]);
    const availableMethod = HTTP_METHODS.find((m) => !pathItem[m]);
    if (availableMethod) {
      dispatch({
        type: 'ADD_OPERATION',
        payload: { path, method: availableMethod },
      });
    }
  };

  const updatePathItem = (updates: Partial<PathItemObject>) => {
    dispatch({
      type: 'UPDATE_PATH',
      payload: { path, pathItem: updates },
    });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CollapsibleTrigger className="flex items-center gap-2 hover:text-primary">
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isOpen ? '' : '-rotate-90'}`}
              />
              <Route className="h-4 w-4" />
            </CollapsibleTrigger>

            <div className="flex-1 flex items-center gap-2">
              <Input
                value={localPath}
                onChange={(e) => setLocalPath(e.target.value)}
                onBlur={handlePathBlur}
                className="font-mono text-sm flex-1"
                placeholder="/path"
              />
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDescription(!showDescription)}
                title="Edit description"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={addOperation} title="Add operation">
                <Plus className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={duplicatePath} title="Duplicate path">
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={removePath} title="Remove path">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>

          <div className="flex gap-1 mt-2">
            {operations.map((method) => (
              <Badge
                key={method}
                variant="secondary"
                className={getMethodColor(method)}
              >
                {method.toUpperCase()}
              </Badge>
            ))}
            {operations.length === 0 && (
              <span className="text-xs text-muted-foreground">No operations</span>
            )}
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {showDescription && (
              <Card className="bg-muted/50">
                <CardContent className="py-4 space-y-3">
                  <div className="space-y-2">
                    <Label>Path Summary</Label>
                    <Input
                      value={pathItem.summary || ''}
                      onChange={(e) => updatePathItem({ summary: e.target.value })}
                      placeholder="Brief summary of this path"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Path Description</Label>
                    <Textarea
                      value={pathItem.description || ''}
                      onChange={(e) => updatePathItem({ description: e.target.value })}
                      placeholder="Detailed description (supports Markdown)"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {operations.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-4">
                  No operations defined for this path
                </p>
                <Button onClick={addOperation}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Operation
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {operations.map((method) => (
                  <OperationEditor
                    key={method}
                    path={path}
                    method={method}
                    operation={pathItem[method]!}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function getMethodColor(method: HttpMethod): string {
  const colors: Record<HttpMethod, string> = {
    get: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    post: 'bg-green-500/10 text-green-700 dark:text-green-400',
    put: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    patch: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
    delete: 'bg-red-500/10 text-red-700 dark:text-red-400',
    options: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
    head: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400',
    trace: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
  };
  return colors[method];
}

export function PathsTab() {
  const { spec, dispatch, save } = useOpenAPI();
  const paths = Object.entries(spec.paths || {});

  const addPath = () => {
    dispatch({ type: 'ADD_PATH' });
  };

  const removeAllPaths = () => {
    if (confirm('Are you sure you want to remove all paths? This action saves a snapshot first.')) {
      save();
      dispatch({ type: 'REMOVE_ALL_PATHS' });
    }
  };

  return (
    <div className="flex gap-6">
      {/* Sidebar navigation */}
      <div className="hidden lg:block w-64 shrink-0">
        <Card className="sticky top-20">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Paths</CardTitle>
          </CardHeader>
          <CardContent className="py-0 pb-3">
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-1">
                {paths.map(([path, pathItem]) => (
                  <a
                    key={path}
                    href={`#path-${path.replace(/[/{}]/g, '')}`}
                    className="block text-sm py-1 px-2 rounded hover:bg-muted truncate font-mono"
                    title={path}
                  >
                    {path}
                    <div className="flex gap-1 mt-1">
                      {HTTP_METHODS.filter((m) => pathItem[m]).map((m) => (
                        <span
                          key={m}
                          className={`text-[10px] px-1 rounded ${getMethodColor(m)}`}
                        >
                          {m.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </a>
                ))}
                {paths.length === 0 && (
                  <p className="text-xs text-muted-foreground py-2">No paths defined</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Main content */}
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">API Paths</h2>
            <p className="text-muted-foreground">
              Define endpoints and their operations
            </p>
          </div>
          <div className="flex gap-2">
            {paths.length > 0 && (
              <Button variant="outline" onClick={removeAllPaths}>
                <Trash2 className="h-4 w-4 mr-2" />
                Remove All
              </Button>
            )}
            <Button onClick={addPath}>
              <Plus className="h-4 w-4 mr-2" />
              Add Path
            </Button>
          </div>
        </div>

        {paths.length === 0 ? (
          <Card>
            <CardContent className="py-10">
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Route className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">No Paths Defined</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Start building your API by adding paths and operations.
                  </p>
                </div>
                <Button onClick={addPath}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Path
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {paths.map(([path, pathItem]) => (
              <div key={path} id={`path-${path.replace(/[/{}]/g, '')}`}>
                <PathEditor path={path} pathItem={pathItem} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
