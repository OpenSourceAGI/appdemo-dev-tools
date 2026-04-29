'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useOpenAPI, type LinkObject, type HttpMethod } from '@/lib/openapi';
import { Plus, Trash2, ChevronDown, Link2 } from 'lucide-react';
import { useState } from 'react';

interface LinksEditorProps {
  path: string;
  method: HttpMethod;
  statusCode: string;
  links: Record<string, LinkObject> | undefined;
  onUpdate: (links: Record<string, LinkObject> | undefined) => void;
}

interface SingleLinkEditorProps {
  linkName: string;
  link: LinkObject;
  availableOperations: { operationId: string; path: string; method: string }[];
  onRename: (newName: string) => void;
  onUpdate: (link: LinkObject) => void;
  onRemove: () => void;
}

function SingleLinkEditor({
  linkName,
  link,
  availableOperations,
  onRename,
  onUpdate,
  onRemove,
}: SingleLinkEditorProps) {
  const [localName, setLocalName] = useState(linkName);
  const [isOpen, setIsOpen] = useState(false);

  const handleNameBlur = () => {
    if (localName !== linkName && localName.trim()) {
      onRename(localName);
    }
  };

  const addParameter = () => {
    const params = { ...link.parameters, newParam: '$response.body#/id' };
    onUpdate({ ...link, parameters: params });
  };

  const updateParameter = (oldKey: string, newKey: string, value: string) => {
    const params = { ...link.parameters };
    if (oldKey !== newKey) {
      delete params[oldKey];
    }
    params[newKey] = value;
    onUpdate({ ...link, parameters: params });
  };

  const removeParameter = (key: string) => {
    const params = { ...link.parameters };
    delete params[key];
    onUpdate({ ...link, parameters: Object.keys(params).length > 0 ? params : undefined });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-muted/30">
        <CardContent className="py-3">
          <div className="flex items-center gap-2">
            <CollapsibleTrigger className="hover:text-primary">
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isOpen ? '' : '-rotate-90'}`}
              />
            </CollapsibleTrigger>
            <Link2 className="h-4 w-4 text-muted-foreground" />
            <Input
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              onBlur={handleNameBlur}
              placeholder="linkName"
              className="flex-1"
            />
            <Button variant="ghost" size="sm" onClick={onRemove}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>

          <CollapsibleContent>
            <div className="mt-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Target Operation ID</Label>
                  <Select
                    value={link.operationId || ''}
                    onValueChange={(v) => onUpdate({ ...link, operationId: v || undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select operation..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableOperations.map((op) => (
                        <SelectItem key={op.operationId} value={op.operationId}>
                          {op.operationId} ({op.method.toUpperCase()} {op.path})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Operation Ref (alternative)</Label>
                  <Input
                    value={link.operationRef || ''}
                    onChange={(e) => onUpdate({ ...link, operationRef: e.target.value || undefined })}
                    placeholder="#/paths/~1users/get"
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={link.description || ''}
                  onChange={(e) => onUpdate({ ...link, description: e.target.value || undefined })}
                  placeholder="Description of this link"
                  rows={2}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Parameters</Label>
                  <Button variant="outline" size="sm" onClick={addParameter}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Parameter
                  </Button>
                </div>

                {link.parameters && Object.keys(link.parameters).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(link.parameters).map(([key, value]) => (
                      <ParameterRow
                        key={key}
                        paramKey={key}
                        paramValue={String(value)}
                        onUpdate={(newKey, newValue) => updateParameter(key, newKey, newValue)}
                        onRemove={() => removeParameter(key)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No parameters. Use runtime expressions like $response.body#/id
                  </p>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
}

function ParameterRow({
  paramKey,
  paramValue,
  onUpdate,
  onRemove,
}: {
  paramKey: string;
  paramValue: string;
  onUpdate: (key: string, value: string) => void;
  onRemove: () => void;
}) {
  const [localKey, setLocalKey] = useState(paramKey);
  const [localValue, setLocalValue] = useState(paramValue);

  const handleBlur = () => {
    if (localKey !== paramKey || localValue !== paramValue) {
      onUpdate(localKey, localValue);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        value={localKey}
        onChange={(e) => setLocalKey(e.target.value)}
        onBlur={handleBlur}
        placeholder="parameterName"
        className="w-1/3"
      />
      <Input
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        placeholder="$response.body#/id"
        className="flex-1 font-mono text-xs"
      />
      <Button variant="ghost" size="sm" onClick={onRemove}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

export function LinksEditor({ path, method, statusCode, links, onUpdate }: LinksEditorProps) {
  const { spec } = useOpenAPI();

  // Collect all available operations with operationIds
  const availableOperations: { operationId: string; path: string; method: string }[] = [];
  for (const [p, pathItem] of Object.entries(spec.paths || {})) {
    for (const m of ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace'] as const) {
      const op = pathItem[m];
      if (op?.operationId) {
        availableOperations.push({ operationId: op.operationId, path: p, method: m });
      }
    }
  }

  const addLink = () => {
    const currentLinks = links || {};
    let name = 'newLink';
    let counter = 1;
    while (currentLinks[name]) {
      name = `newLink${counter++}`;
    }
    onUpdate({ ...currentLinks, [name]: {} });
  };

  const updateLink = (oldName: string, newName: string, link: LinkObject) => {
    const currentLinks = { ...links };
    if (oldName !== newName) {
      delete currentLinks[oldName];
    }
    currentLinks[newName] = link;
    onUpdate(currentLinks);
  };

  const removeLink = (name: string) => {
    const currentLinks = { ...links };
    delete currentLinks[name];
    onUpdate(Object.keys(currentLinks).length > 0 ? currentLinks : undefined);
  };

  if (!links || Object.keys(links).length === 0) {
    return (
      <div className="text-center py-4">
        <Link2 className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-3">
          No links defined. Links describe relationships between operations.
        </p>
        <Button variant="outline" size="sm" onClick={addLink}>
          <Plus className="h-4 w-4 mr-1" />
          Add Link
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">Links</Label>
        <Button variant="outline" size="sm" onClick={addLink}>
          <Plus className="h-3 w-3 mr-1" />
          Add Link
        </Button>
      </div>

      <div className="space-y-2">
        {Object.entries(links).map(([name, link]) => (
          <SingleLinkEditor
            key={name}
            linkName={name}
            link={link}
            availableOperations={availableOperations}
            onRename={(newName) => updateLink(name, newName, link)}
            onUpdate={(l) => updateLink(name, name, l)}
            onRemove={() => removeLink(name)}
          />
        ))}
      </div>
    </div>
  );
}
