'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useOpenAPI, type RequestBodyObject, type HttpMethod } from '@/lib/openapi';
import { Plus, Trash2 } from 'lucide-react';
import { MediaTypeEditor } from './media-type-editor';

interface RequestBodyEditorProps {
  path: string;
  method: HttpMethod;
  requestBody: RequestBodyObject;
  onRemove: () => void;
}

export function RequestBodyEditor({
  path,
  method,
  requestBody,
  onRemove,
}: RequestBodyEditorProps) {
  const { dispatch } = useOpenAPI();

  const updateRequestBody = (updates: Partial<RequestBodyObject>) => {
    dispatch({
      type: 'UPDATE_REQUEST_BODY',
      payload: {
        path,
        method,
        requestBody: { ...requestBody, ...updates },
      },
    });
  };

  const addMediaType = () => {
    const content = { ...requestBody.content, 'application/json': { schema: {} } };
    updateRequestBody({ content });
  };

  const updateMediaType = (oldName: string, newName: string, mediaType: object) => {
    const content = { ...requestBody.content };
    if (oldName !== newName) {
      delete content[oldName];
    }
    content[newName] = mediaType;
    updateRequestBody({ content });
  };

  const removeMediaType = (name: string) => {
    const content = { ...requestBody.content };
    delete content[name];
    // Ensure at least one media type exists
    if (Object.keys(content).length === 0) {
      content['application/json'] = { schema: {} };
    }
    updateRequestBody({ content });
  };

  return (
    <Card>
      <CardContent className="py-4 space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Request Body</Label>
          <Button variant="destructive" size="sm" onClick={onRemove}>
            <Trash2 className="h-4 w-4 mr-1" />
            Remove
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={requestBody.description || ''}
            onChange={(e) => updateRequestBody({ description: e.target.value })}
            placeholder="Description of the request body"
            rows={2}
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="rb-required"
            checked={requestBody.required || false}
            onCheckedChange={(checked) => updateRequestBody({ required: !!checked })}
          />
          <Label htmlFor="rb-required" className="cursor-pointer">
            Required
          </Label>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="font-medium">Media Types</Label>
            <Button variant="outline" size="sm" onClick={addMediaType}>
              <Plus className="h-3 w-3 mr-1" />
              Add Media Type
            </Button>
          </div>

          <div className="space-y-2">
            {Object.entries(requestBody.content || {}).map(([name, mediaType]) => (
              <MediaTypeEditor
                key={name}
                name={name}
                mediaType={mediaType}
                onUpdate={(newName, updated) => updateMediaType(name, newName, updated)}
                onRemove={() => removeMediaType(name)}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
