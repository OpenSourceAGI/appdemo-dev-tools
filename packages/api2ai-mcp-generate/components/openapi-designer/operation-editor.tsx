'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useOpenAPI, type OperationObject, type HttpMethod, HTTP_METHODS } from '@/lib/openapi';
import { Plus, Trash2, ChevronDown, Copy, Settings, MessageSquare, FileText, List, Shield, Webhook, Link2 } from 'lucide-react';
import { useState } from 'react';
import { ParameterEditor } from './parameter-editor';
import { ResponseEditor } from './response-editor';
import { RequestBodyEditor } from './request-body-editor';
import { CallbacksEditor } from './callbacks-editor';
import { LinksEditor } from './links-editor';
import { MarkdownEditor } from './markdown-preview';

interface OperationEditorProps {
  path: string;
  method: HttpMethod;
  operation: OperationObject;
}

function getMethodColor(method: HttpMethod): string {
  const colors: Record<HttpMethod, string> = {
    get: 'bg-blue-500 text-white',
    post: 'bg-green-500 text-white',
    put: 'bg-amber-500 text-white',
    patch: 'bg-orange-500 text-white',
    delete: 'bg-red-500 text-white',
    options: 'bg-purple-500 text-white',
    head: 'bg-cyan-500 text-white',
    trace: 'bg-gray-500 text-white',
  };
  return colors[method];
}

export function OperationEditor({ path, method, operation }: OperationEditorProps) {
  const { spec, dispatch, save } = useOpenAPI();
  const [isOpen, setIsOpen] = useState(false);

  const updateOperation = (updates: Partial<OperationObject>) => {
    dispatch({
      type: 'UPDATE_OPERATION',
      payload: { path, method, operation: updates },
    });
  };

  const removeOperation = () => {
    save();
    dispatch({
      type: 'REMOVE_OPERATION',
      payload: { path, method },
    });
  };

  const duplicateOperation = () => {
    const availableMethod = HTTP_METHODS.find(
      (m) => m !== method && !spec.paths[path]?.[m]
    );
    if (availableMethod) {
      dispatch({
        type: 'ADD_OPERATION',
        payload: { path, method: availableMethod },
      });
      dispatch({
        type: 'UPDATE_OPERATION',
        payload: { path, method: availableMethod, operation: { ...operation } },
      });
    }
  };

  const changeMethod = (newMethod: HttpMethod) => {
    dispatch({
      type: 'RENAME_OPERATION',
      payload: { path, oldMethod: method, newMethod },
    });
  };

  const addParameter = () => {
    dispatch({
      type: 'ADD_PARAMETER',
      payload: { path, method },
    });
  };

  const addResponse = () => {
    let statusCode = '200';
    let counter = 200;
    while (operation.responses[statusCode]) {
      counter++;
      statusCode = counter.toString();
    }
    dispatch({
      type: 'ADD_RESPONSE',
      payload: { path, method, statusCode },
    });
  };

  const addRequestBody = () => {
    dispatch({
      type: 'ADD_REQUEST_BODY',
      payload: { path, method },
    });
  };

  const removeRequestBody = () => {
    save();
    dispatch({
      type: 'REMOVE_REQUEST_BODY',
      payload: { path, method },
    });
  };

  // Get available tags from spec
  const availableTags = spec.tags?.map((t) => t.name) || [];

  const toggleTag = (tagName: string) => {
    const currentTags = operation.tags || [];
    const newTags = currentTags.includes(tagName)
      ? currentTags.filter((t) => t !== tagName)
      : [...currentTags, tagName];
    updateOperation({ tags: newTags });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-l-4" style={{ borderLeftColor: `var(--${method}-color, #666)` }}>
        <CardHeader className="py-3">
          <div className="flex items-center gap-2">
            <CollapsibleTrigger className="flex items-center gap-2 hover:text-primary">
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isOpen ? '' : '-rotate-90'}`}
              />
              <Badge className={getMethodColor(method)}>
                {method.toUpperCase()}
              </Badge>
            </CollapsibleTrigger>

            <span className="text-sm font-medium flex-1 truncate">
              {operation.operationId || operation.summary || 'Untitled Operation'}
            </span>

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={addParameter} title="Add parameter">
                <Plus className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={duplicateOperation} title="Duplicate">
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={removeOperation} title="Remove">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            <Tabs defaultValue="main" className="w-full">
              <TabsList className="flex flex-wrap h-auto gap-1">
                <TabsTrigger value="main" className="gap-1">
                  <Settings className="h-3 w-3" />
                  <span className="hidden sm:inline">Main</span>
                </TabsTrigger>
                <TabsTrigger value="description" className="gap-1">
                  <MessageSquare className="h-3 w-3" />
                  <span className="hidden sm:inline">Description</span>
                </TabsTrigger>
                <TabsTrigger value="parameters" className="gap-1">
                  <List className="h-3 w-3" />
                  <span className="hidden sm:inline">Params</span>
                </TabsTrigger>
                <TabsTrigger value="requestBody" className="gap-1">
                  <FileText className="h-3 w-3" />
                  <span className="hidden sm:inline">Body</span>
                </TabsTrigger>
                <TabsTrigger value="responses" className="gap-1">
                  <Shield className="h-3 w-3" />
                  <span className="hidden sm:inline">Responses</span>
                </TabsTrigger>
                <TabsTrigger value="callbacks" className="gap-1">
                  <Webhook className="h-3 w-3" />
                  <span className="hidden sm:inline">Callbacks</span>
                </TabsTrigger>
                <TabsTrigger value="links" className="gap-1">
                  <Link2 className="h-3 w-3" />
                  <span className="hidden sm:inline">Links</span>
                </TabsTrigger>
              </TabsList>

              {/* Main Tab */}
              <TabsContent value="main" className="space-y-4 mt-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>HTTP Method</Label>
                    <Select value={method} onValueChange={changeMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HTTP_METHODS.map((m) => (
                          <SelectItem
                            key={m}
                            value={m}
                            disabled={m !== method && !!spec.paths[path]?.[m]}
                          >
                            {m.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor={`opId-${method}`}>Operation ID</Label>
                    <Input
                      id={`opId-${method}`}
                      value={operation.operationId || ''}
                      onChange={(e) => updateOperation({ operationId: e.target.value })}
                      placeholder="getUsers, createOrder, etc."
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`deprecated-${method}`}
                      checked={operation.deprecated || false}
                      onCheckedChange={(checked) =>
                        updateOperation({ deprecated: !!checked })
                      }
                    />
                    <Label htmlFor={`deprecated-${method}`} className="cursor-pointer">
                      Deprecated
                    </Label>
                  </div>
                </div>
              </TabsContent>

              {/* Description Tab */}
              <TabsContent value="description" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Summary</Label>
                  <Input
                    value={operation.summary || ''}
                    onChange={(e) => updateOperation({ summary: e.target.value })}
                    placeholder="Brief summary of the operation"
                  />
                </div>

                <MarkdownEditor
                  label="Description"
                  value={operation.description || ''}
                  onChange={(value) => updateOperation({ description: value })}
                  placeholder="Detailed description (supports Markdown)"
                  rows={4}
                />

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={operation.tags?.includes(tag) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                    {availableTags.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        No tags defined. Add tags in the Tags tab first.
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>External Docs URL</Label>
                  <Input
                    type="url"
                    value={operation.externalDocs?.url || ''}
                    onChange={(e) =>
                      updateOperation({
                        externalDocs: { ...operation.externalDocs, url: e.target.value },
                      })
                    }
                    placeholder="https://docs.example.com/..."
                  />
                </div>
              </TabsContent>

              {/* Parameters Tab */}
              <TabsContent value="parameters" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Parameters</Label>
                  <Button variant="outline" size="sm" onClick={addParameter}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Parameter
                  </Button>
                </div>

                {!operation.parameters || operation.parameters.length === 0 ? (
                  <Card className="bg-muted/50">
                    <CardContent className="py-6 text-center">
                      <p className="text-sm text-muted-foreground mb-4">
                        No parameters defined for this operation.
                      </p>
                      <Button onClick={addParameter}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Parameter
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {operation.parameters.map((param, index) => (
                      <ParameterEditor
                        key={index}
                        path={path}
                        method={method}
                        parameter={param}
                        index={index}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Request Body Tab */}
              <TabsContent value="requestBody" className="space-y-4 mt-4">
                {!operation.requestBody ? (
                  <Card className="bg-muted/50">
                    <CardContent className="py-6 text-center">
                      <p className="text-sm text-muted-foreground mb-4">
                        No request body defined. Request bodies on GET and DELETE operations are typically ignored.
                      </p>
                      <Button onClick={addRequestBody}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Request Body
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <RequestBodyEditor
                    path={path}
                    method={method}
                    requestBody={operation.requestBody}
                    onRemove={removeRequestBody}
                  />
                )}
              </TabsContent>

              {/* Responses Tab */}
              <TabsContent value="responses" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Responses</Label>
                  <Button variant="outline" size="sm" onClick={addResponse}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Response
                  </Button>
                </div>

                <div className="space-y-3">
                  {Object.entries(operation.responses || {}).map(([statusCode, response]) => (
                    <ResponseEditor
                      key={statusCode}
                      path={path}
                      method={method}
                      statusCode={statusCode}
                      response={response}
                    />
                  ))}
                </div>
              </TabsContent>

              {/* Callbacks Tab */}
              <TabsContent value="callbacks" className="space-y-4 mt-4">
                <CallbacksEditor
                  path={path}
                  method={method}
                  callbacks={operation.callbacks}
                />
              </TabsContent>

              {/* Links Tab - shows links from all responses */}
              <TabsContent value="links" className="space-y-4 mt-4">
                <div className="space-y-4">
                  {Object.entries(operation.responses || {}).map(([statusCode, response]) => (
                    <div key={statusCode} className="space-y-2">
                      <Label className="text-sm font-medium">Response {statusCode} Links</Label>
                      <LinksEditor
                        path={path}
                        method={method}
                        statusCode={statusCode}
                        links={response.links}
                        onUpdate={(links) => {
                          dispatch({
                            type: 'UPDATE_RESPONSE',
                            payload: {
                              path,
                              method,
                              statusCode,
                              response: { links },
                            },
                          });
                        }}
                      />
                    </div>
                  ))}
                  {(!operation.responses || Object.keys(operation.responses).length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Add responses first to configure links between operations.
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
