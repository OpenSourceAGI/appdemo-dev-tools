'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useOpenAPI, type TagObject } from '@/lib/openapi';
import { Plus, Trash2, Tag, Link } from 'lucide-react';
import { useState } from 'react';

interface TagEditorProps {
  tag: TagObject;
  index: number;
}

function TagEditor({ tag, index }: TagEditorProps) {
  const { dispatch } = useOpenAPI();

  const updateTag = (updates: Partial<TagObject>) => {
    dispatch({
      type: 'UPDATE_TAG',
      payload: { index, tag: { ...tag, ...updates } },
    });
  };

  const removeTag = () => {
    dispatch({ type: 'REMOVE_TAG', payload: index });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-lg">{tag.name || 'Unnamed Tag'}</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={removeTag}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`tag-name-${index}`}>Name *</Label>
          <Input
            id={`tag-name-${index}`}
            value={tag.name}
            onChange={(e) => updateTag({ name: e.target.value })}
            placeholder="Tag name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`tag-desc-${index}`}>Description</Label>
          <Textarea
            id={`tag-desc-${index}`}
            value={tag.description || ''}
            onChange={(e) => updateTag({ description: e.target.value })}
            placeholder="Tag description (supports Markdown)"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`tag-extdocs-${index}`}>External Docs Description</Label>
          <Textarea
            id={`tag-extdocs-${index}`}
            value={tag.externalDocs?.description || ''}
            onChange={(e) =>
              updateTag({
                externalDocs: { ...tag.externalDocs, description: e.target.value },
              })
            }
            placeholder="Description of external documentation"
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`tag-extdocs-url-${index}`}>External Docs URL</Label>
          <div className="relative">
            <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id={`tag-extdocs-url-${index}`}
              type="url"
              value={tag.externalDocs?.url || ''}
              onChange={(e) =>
                updateTag({
                  externalDocs: { ...tag.externalDocs, url: e.target.value },
                })
              }
              placeholder="https://docs.example.com/tags/..."
              className="pl-10"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TagsTab() {
  const { spec, dispatch } = useOpenAPI();
  const tags = spec.tags || [];

  const addTag = () => {
    dispatch({ type: 'ADD_TAG' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tags</h2>
          <p className="text-muted-foreground">
            Group and organize your API operations using tags
          </p>
        </div>
        <Button onClick={addTag}>
          <Plus className="h-4 w-4 mr-2" />
          Add Tag
        </Button>
      </div>

      {tags.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Tag className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">No Tags Defined</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Tags help organize operations into logical groups for better documentation.
                </p>
              </div>
              <Button onClick={addTag}>
                <Plus className="h-4 w-4 mr-2" />
                Create Tag
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {tags.map((tag, index) => (
            <TagEditor key={index} tag={tag} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
