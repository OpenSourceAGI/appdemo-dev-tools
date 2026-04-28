'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useOpenAPI, type MediaTypeObject, type SchemaObject } from '@/lib/openapi';
import { Trash2, Copy, Edit, Link2 } from 'lucide-react';
import { useState } from 'react';

interface MediaTypeEditorProps {
  name: string;
  mediaType: MediaTypeObject;
  onUpdate: (newName: string, mediaType: MediaTypeObject) => void;
  onRemove: () => void;
}

const COMMON_MEDIA_TYPES = [
  'application/json',
  'application/xml',
  'application/x-www-form-urlencoded',
  'multipart/form-data',
  'text/plain',
  'text/html',
  'application/octet-stream',
];

export function MediaTypeEditor({ name, mediaType, onUpdate, onRemove }: MediaTypeEditorProps) {
  const { spec } = useOpenAPI();
  const [localName, setLocalName] = useState(name);
  const [showSchemaEditor, setShowSchemaEditor] = useState(false);
  const [schemaJson, setSchemaJson] = useState('');

  const schemas = spec.components?.schemas || {};
  const schemaRef = (mediaType.schema as { $ref?: string })?.$ref;
  const selectedSchemaName = schemaRef?.replace('#/components/schemas/', '');

  const handleNameBlur = () => {
    if (localName !== name && localName.trim()) {
      onUpdate(localName, mediaType);
    }
  };

  const handleSchemaSelect = (schemaName: string) => {
    if (schemaName === '_inline') {
      // Switch to inline schema
      onUpdate(name, { ...mediaType, schema: {} });
    } else {
      // Use reference to shared schema
      onUpdate(name, {
        ...mediaType,
        schema: { $ref: `#/components/schemas/${schemaName}` },
      });
    }
  };

  const openSchemaEditor = () => {
    const schema = mediaType.schema || {};
    // Remove $ref if present to show the actual schema
    const schemaToEdit = '$ref' in schema ? {} : schema;
    setSchemaJson(JSON.stringify(schemaToEdit, null, 2));
    setShowSchemaEditor(true);
  };

  const saveSchema = () => {
    try {
      const parsed = JSON.parse(schemaJson);
      onUpdate(name, { ...mediaType, schema: parsed });
      setShowSchemaEditor(false);
    } catch (e) {
      alert('Invalid JSON schema');
    }
  };

  return (
    <Card className="bg-muted/30">
      <CardContent className="py-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Badge variant="outline" className="shrink-0">Media Type</Badge>
            <Select value={localName} onValueChange={(v) => {
              setLocalName(v);
              onUpdate(v, mediaType);
            }}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select media type" />
              </SelectTrigger>
              <SelectContent>
                {COMMON_MEDIA_TYPES.map((mt) => (
                  <SelectItem key={mt} value={mt}>
                    {mt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={selectedSchemaName || '_inline'}
              onValueChange={handleSchemaSelect}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select schema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_inline">
                  <span className="flex items-center gap-2">
                    <Edit className="h-3 w-3" />
                    Inline Schema
                  </span>
                </SelectItem>
                {Object.keys(schemas).map((schemaName) => (
                  <SelectItem key={schemaName} value={schemaName}>
                    <span className="flex items-center gap-2">
                      <Link2 className="h-3 w-3" />
                      {schemaName}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog open={showSchemaEditor} onOpenChange={setShowSchemaEditor}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={openSchemaEditor}
                  title={selectedSchemaName ? `Edit shared schema (${selectedSchemaName})` : 'Edit inline schema'}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Schema</DialogTitle>
                  <DialogDescription>
                    Edit the JSON schema for this media type. Use JSON format.
                  </DialogDescription>
                </DialogHeader>
                <Textarea
                  value={schemaJson}
                  onChange={(e) => setSchemaJson(e.target.value)}
                  className="font-mono text-sm min-h-[300px]"
                  placeholder='{"type": "object", "properties": {}}'
                />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowSchemaEditor(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveSchema}>Save Schema</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button variant="ghost" size="sm" onClick={onRemove}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>

        {selectedSchemaName && (
          <div className="mt-2 text-xs text-muted-foreground">
            Using schema: <code className="bg-muted px-1 rounded">{selectedSchemaName}</code>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
