'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useOpenAPI, type SchemaObject } from '@/lib/openapi';
import { Plus, Trash2, Copy, Edit, ChevronDown, Code } from 'lucide-react';
import { useState } from 'react';

interface SchemaEditorProps {
  name: string;
  schema: SchemaObject;
}

function SchemaEditor({ name, schema }: SchemaEditorProps) {
  const { dispatch, save } = useOpenAPI();
  const [isOpen, setIsOpen] = useState(false);
  const [localName, setLocalName] = useState(name);
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  const [schemaJson, setSchemaJson] = useState('');

  const handleNameBlur = () => {
    if (localName !== name && localName.trim()) {
      dispatch({
        type: 'RENAME_SCHEMA',
        payload: { oldName: name, newName: localName },
      });
    }
  };

  const removeSchema = () => {
    save();
    dispatch({ type: 'REMOVE_SCHEMA', payload: name });
  };

  const duplicateSchema = () => {
    dispatch({ type: 'DUPLICATE_SCHEMA', payload: name });
  };

  const openJsonEditor = () => {
    setSchemaJson(JSON.stringify(schema, null, 2));
    setShowJsonEditor(true);
  };

  const saveSchema = () => {
    try {
      const parsed = JSON.parse(schemaJson);
      dispatch({
        type: 'UPDATE_SCHEMA',
        payload: { name, schema: parsed },
      });
      setShowJsonEditor(false);
    } catch (e) {
      alert('Invalid JSON');
    }
  };

  const getSchemaTypeLabel = () => {
    if (schema.type) return schema.type;
    if (schema.$ref) return 'reference';
    if (schema.properties) return 'object';
    if (schema.items) return 'array';
    return 'unknown';
  };

  const propertyCount = schema.properties ? Object.keys(schema.properties).length : 0;
  const requiredCount = schema.required?.length || 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center gap-2">
            <CollapsibleTrigger className="flex items-center gap-2 hover:text-primary">
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isOpen ? '' : '-rotate-90'}`}
              />
              <Code className="h-4 w-4" />
            </CollapsibleTrigger>

            <Input
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              onBlur={handleNameBlur}
              className="font-mono text-sm flex-1"
            />

            <Badge variant="outline">{getSchemaTypeLabel()}</Badge>

            {propertyCount > 0 && (
              <Badge variant="secondary">
                {propertyCount} prop{propertyCount !== 1 ? 's' : ''}
              </Badge>
            )}

            <Dialog open={showJsonEditor} onOpenChange={setShowJsonEditor}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" onClick={openJsonEditor} title="Edit JSON">
                  <Edit className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>Edit Schema: {name}</DialogTitle>
                  <DialogDescription>
                    Edit the JSON schema directly. Changes will be saved when you click Save.
                  </DialogDescription>
                </DialogHeader>
                <Textarea
                  value={schemaJson}
                  onChange={(e) => setSchemaJson(e.target.value)}
                  className="font-mono text-sm min-h-[400px]"
                />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowJsonEditor(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveSchema}>Save Schema</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button variant="ghost" size="sm" onClick={duplicateSchema} title="Duplicate">
              <Copy className="h-4 w-4" />
            </Button>

            <Button variant="ghost" size="sm" onClick={removeSchema} title="Remove">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {schema.description && (
              <p className="text-sm text-muted-foreground">{schema.description}</p>
            )}

            {schema.type === 'object' && schema.properties && (
              <div className="space-y-2">
                <Label className="font-medium">Properties</Label>
                <div className="grid gap-2">
                  {Object.entries(schema.properties).map(([propName, propSchema]) => {
                    const propSchemaObj = propSchema as SchemaObject;
                    const isRequired = schema.required?.includes(propName);
                    return (
                      <div
                        key={propName}
                        className="flex items-center gap-2 p-2 bg-muted/50 rounded"
                      >
                        <code className="font-mono text-sm">{propName}</code>
                        <Badge variant="outline" className="text-xs">
                          {propSchemaObj.type || propSchemaObj.$ref?.split('/').pop() || 'any'}
                        </Badge>
                        {isRequired && (
                          <Badge variant="destructive" className="text-xs">
                            required
                          </Badge>
                        )}
                        {propSchemaObj.description && (
                          <span className="text-xs text-muted-foreground truncate flex-1">
                            {propSchemaObj.description}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {schema.type === 'array' && schema.items && (
              <div className="space-y-2">
                <Label className="font-medium">Array Items</Label>
                <div className="p-2 bg-muted/50 rounded">
                  <code className="font-mono text-sm">
                    {(schema.items as SchemaObject).type ||
                      (schema.items as { $ref?: string }).$ref?.split('/').pop() ||
                      'any'}
                  </code>
                </div>
              </div>
            )}

            {schema.enum && (
              <div className="space-y-2">
                <Label className="font-medium">Enum Values</Label>
                <div className="flex flex-wrap gap-2">
                  {schema.enum.map((value, idx) => (
                    <Badge key={idx} variant="secondary">
                      {String(value)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2">
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  View raw JSON
                </summary>
                <pre className="mt-2 p-3 bg-muted rounded overflow-auto text-xs">
                  {JSON.stringify(schema, null, 2)}
                </pre>
              </details>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export function SchemasTab() {
  const { spec, dispatch } = useOpenAPI();
  const schemas = spec.components?.schemas || {};
  const schemaEntries = Object.entries(schemas);

  const addSchema = () => {
    dispatch({ type: 'ADD_SCHEMA' });
  };

  return (
    <div className="flex gap-6">
      {/* Sidebar navigation */}
      <div className="hidden lg:block w-64 shrink-0">
        <Card className="sticky top-20">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Schemas</CardTitle>
          </CardHeader>
          <CardContent className="py-0 pb-3">
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-1">
                {schemaEntries.map(([name, schema]) => (
                  <a
                    key={name}
                    href={`#schema-${name}`}
                    className="block text-sm py-1 px-2 rounded hover:bg-muted truncate font-mono"
                    title={name}
                  >
                    {name}
                    <Badge variant="outline" className="ml-2 text-[10px]">
                      {(schema as SchemaObject).type || 'object'}
                    </Badge>
                  </a>
                ))}
                {schemaEntries.length === 0 && (
                  <p className="text-xs text-muted-foreground py-2">No schemas defined</p>
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
            <h2 className="text-2xl font-bold">Schemas</h2>
            <p className="text-muted-foreground">
              Define reusable data models for your API
            </p>
          </div>
          <Button onClick={addSchema}>
            <Plus className="h-4 w-4 mr-2" />
            Add Schema
          </Button>
        </div>

        {schemaEntries.length === 0 ? (
          <Card>
            <CardContent className="py-10">
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Code className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">No Schemas Defined</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Create reusable schemas that can be referenced throughout your API definition.
                  </p>
                </div>
                <Button onClick={addSchema}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Schema
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {schemaEntries.map(([name, schema]) => (
              <div key={name} id={`schema-${name}`}>
                <SchemaEditor name={name} schema={schema as SchemaObject} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
