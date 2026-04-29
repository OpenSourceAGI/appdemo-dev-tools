'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  useOpenAPI,
  type ResponseObject,
  type ReferenceObject,
  type HttpMethod,
} from '@/lib/openapi';
import { Plus, Trash2, ChevronDown, Copy } from 'lucide-react';
import { useState } from 'react';
import { MediaTypeEditor } from './media-type-editor';

interface ResponseEditorProps {
  path: string;
  method: HttpMethod;
  statusCode: string;
  response: ResponseObject | ReferenceObject;
}

function getStatusColor(code: string): string {
  if (code === 'default') return 'bg-gray-500/10 text-gray-700';
  const num = parseInt(code);
  if (num >= 200 && num < 300) return 'bg-green-500/10 text-green-700';
  if (num >= 300 && num < 400) return 'bg-blue-500/10 text-blue-700';
  if (num >= 400 && num < 500) return 'bg-amber-500/10 text-amber-700';
  if (num >= 500) return 'bg-red-500/10 text-red-700';
  return 'bg-gray-500/10 text-gray-700';
}

function getStatusText(code: string): string {
  const statusTexts: Record<string, string> = {
    default: 'Default',
    '200': 'OK',
    '201': 'Created',
    '202': 'Accepted',
    '204': 'No Content',
    '301': 'Moved Permanently',
    '302': 'Found',
    '304': 'Not Modified',
    '400': 'Bad Request',
    '401': 'Unauthorized',
    '403': 'Forbidden',
    '404': 'Not Found',
    '405': 'Method Not Allowed',
    '409': 'Conflict',
    '422': 'Unprocessable Entity',
    '429': 'Too Many Requests',
    '500': 'Internal Server Error',
    '502': 'Bad Gateway',
    '503': 'Service Unavailable',
  };
  return statusTexts[code] || '';
}

export function ResponseEditor({ path, method, statusCode, response }: ResponseEditorProps) {
  const { spec, dispatch, save } = useOpenAPI();
  const [isOpen, setIsOpen] = useState(false);
  const [localStatusCode, setLocalStatusCode] = useState(statusCode);

  // Handle $ref responses
  if ('$ref' in response) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="py-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={getStatusColor(statusCode)}>
              {statusCode}
            </Badge>
            <span className="text-sm text-muted-foreground">Reference: {response.$ref}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const updateResponse = (updates: Partial<ResponseObject>) => {
    dispatch({
      type: 'UPDATE_RESPONSE',
      payload: {
        path,
        method,
        statusCode,
        response: { ...response, ...updates },
      },
    });
  };

  const handleStatusCodeBlur = () => {
    if (localStatusCode !== statusCode && localStatusCode.trim()) {
      dispatch({
        type: 'RENAME_RESPONSE',
        payload: {
          path,
          method,
          oldStatus: statusCode,
          newStatus: localStatusCode,
        },
      });
    }
  };

  const removeResponse = () => {
    save();
    dispatch({
      type: 'REMOVE_RESPONSE',
      payload: { path, method, statusCode },
    });
  };

  const addMediaType = () => {
    const content = { ...response.content, 'application/json': { schema: {} } };
    updateResponse({ content });
  };

  const updateMediaType = (oldName: string, newName: string, mediaType: object) => {
    const content = { ...response.content };
    if (oldName !== newName) {
      delete content[oldName];
    }
    content[newName] = mediaType;
    updateResponse({ content });
  };

  const removeMediaType = (name: string) => {
    const content = { ...response.content };
    delete content[name];
    updateResponse({ content: Object.keys(content).length > 0 ? content : undefined });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-muted/30">
        <CardContent className="py-3">
          <div className="flex items-center gap-2">
            <CollapsibleTrigger className="flex items-center gap-2 hover:text-primary">
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isOpen ? '' : '-rotate-90'}`}
              />
            </CollapsibleTrigger>

            <Badge variant="secondary" className={getStatusColor(statusCode)}>
              {statusCode}
            </Badge>

            <span className="text-sm text-muted-foreground">{getStatusText(statusCode)}</span>

            <span className="flex-1 text-sm truncate">{response.description}</span>

            <Button variant="ghost" size="sm" onClick={removeResponse}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>

          <CollapsibleContent>
            <div className="mt-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Status Code</Label>
                  <Input
                    value={localStatusCode}
                    onChange={(e) => setLocalStatusCode(e.target.value)}
                    onBlur={handleStatusCodeBlur}
                    placeholder="200"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Input
                    value={response.description}
                    onChange={(e) => updateResponse({ description: e.target.value })}
                    placeholder="Response description"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">Media Types</Label>
                  <Button variant="outline" size="sm" onClick={addMediaType}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Media Type
                  </Button>
                </div>

                {!response.content || Object.keys(response.content).length === 0 ? (
                  <Card className="bg-muted/50">
                    <CardContent className="py-4 text-center">
                      <p className="text-sm text-muted-foreground mb-3">
                        No media types defined (optional).
                      </p>
                      <Button size="sm" onClick={addMediaType}>
                        <Plus className="h-3 w-3 mr-1" />
                        Create Media Type
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(response.content).map(([name, mediaType]) => (
                      <MediaTypeEditor
                        key={name}
                        name={name}
                        mediaType={mediaType}
                        onUpdate={(newName, updated) => updateMediaType(name, newName, updated)}
                        onRemove={() => removeMediaType(name)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
}
