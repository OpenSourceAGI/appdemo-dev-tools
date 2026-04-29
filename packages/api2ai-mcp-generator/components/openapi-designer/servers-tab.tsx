'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useOpenAPI, type ServerObject } from '@/lib/openapi';
import { Plus, Trash2, Link, ChevronDown, Variable } from 'lucide-react';
import { useState } from 'react';

interface ServerVariableEditorProps {
  serverIndex: number;
  name: string;
  variable: NonNullable<ServerObject['variables']>[string];
}

function ServerVariableEditor({ serverIndex, name, variable }: ServerVariableEditorProps) {
  const { dispatch } = useOpenAPI();
  const [localName, setLocalName] = useState(name);

  const updateVariable = (updates: Partial<typeof variable>) => {
    dispatch({
      type: 'UPDATE_SERVER_VARIABLE',
      payload: {
        serverIndex,
        oldName: name,
        newName: localName,
        variable: { ...variable, ...updates },
      },
    });
  };

  const handleNameBlur = () => {
    if (localName !== name) {
      dispatch({
        type: 'UPDATE_SERVER_VARIABLE',
        payload: {
          serverIndex,
          oldName: name,
          newName: localName,
          variable,
        },
      });
    }
  };

  const removeVariable = () => {
    dispatch({
      type: 'REMOVE_SERVER_VARIABLE',
      payload: { serverIndex, name },
    });
  };

  const addEnumValue = () => {
    const enumValues = [...(variable.enum || []), 'newValue'];
    updateVariable({ enum: enumValues });
  };

  const updateEnumValue = (index: number, value: string) => {
    const enumValues = [...(variable.enum || [])];
    enumValues[index] = value;
    updateVariable({ enum: enumValues });
  };

  const removeEnumValue = (index: number) => {
    const enumValues = (variable.enum || []).filter((_, i) => i !== index);
    updateVariable({ enum: enumValues.length > 0 ? enumValues : undefined });
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Variable className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Variable</span>
        </div>
        <Button variant="ghost" size="sm" onClick={removeVariable}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1">
          <Label className="text-xs">Name</Label>
          <Input
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            onBlur={handleNameBlur}
            placeholder="variableName"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Default *</Label>
          <Input
            value={variable.default}
            onChange={(e) => updateVariable({ default: e.target.value })}
            placeholder="default-value"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Description</Label>
          <Input
            value={variable.description || ''}
            onChange={(e) => updateVariable({ description: e.target.value })}
            placeholder="Variable description"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Enum Values</Label>
          <Button variant="outline" size="sm" onClick={addEnumValue}>
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
        {variable.enum && variable.enum.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {variable.enum.map((value, index) => (
              <div key={index} className="flex items-center gap-1">
                <Input
                  value={value}
                  onChange={(e) => updateEnumValue(index, e.target.value)}
                  className="w-32 h-8"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => removeEnumValue(index)}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ServerEditorProps {
  server: ServerObject;
  index: number;
}

function ServerEditor({ server, index }: ServerEditorProps) {
  const { dispatch } = useOpenAPI();
  const [isOpen, setIsOpen] = useState(true);

  const updateServer = (updates: Partial<ServerObject>) => {
    dispatch({
      type: 'UPDATE_SERVER',
      payload: { index, server: { ...server, ...updates } },
    });
  };

  const removeServer = () => {
    dispatch({ type: 'REMOVE_SERVER', payload: index });
  };

  const addVariable = () => {
    dispatch({
      type: 'ADD_SERVER_VARIABLE',
      payload: { serverIndex: index, name: 'newVar' },
    });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger className="flex items-center gap-2 hover:text-primary">
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isOpen ? '' : '-rotate-90'}`}
              />
              <CardTitle className="text-lg">Server {index + 1}</CardTitle>
            </CollapsibleTrigger>
            <Button variant="ghost" size="sm" onClick={removeServer}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
          {server.url && (
            <CardDescription className="font-mono text-xs truncate">
              {server.url}
            </CardDescription>
          )}
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`server-url-${index}`}>URL *</Label>
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id={`server-url-${index}`}
                    value={server.url}
                    onChange={(e) => updateServer({ url: e.target.value })}
                    placeholder="https://api.example.com/v1"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`server-desc-${index}`}>Description</Label>
                <Input
                  id={`server-desc-${index}`}
                  value={server.description || ''}
                  onChange={(e) => updateServer({ description: e.target.value })}
                  placeholder="Production server"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Server Variables</Label>
                <Button variant="outline" size="sm" onClick={addVariable}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Variable
                </Button>
              </div>

              {server.variables && Object.keys(server.variables).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(server.variables).map(([name, variable]) => (
                    <ServerVariableEditor
                      key={name}
                      serverIndex={index}
                      name={name}
                      variable={variable}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No variables defined. Variables allow dynamic parts in the server URL.
                </p>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export function ServersTab() {
  const { spec, dispatch } = useOpenAPI();
  const servers = spec.servers || [];

  const addServer = () => {
    dispatch({ type: 'ADD_SERVER' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Servers</h2>
          <p className="text-muted-foreground">
            Define the base URLs for your API endpoints
          </p>
        </div>
        <Button onClick={addServer}>
          <Plus className="h-4 w-4 mr-2" />
          Add Server
        </Button>
      </div>

      {servers.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Link className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">No Servers Defined</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Without servers, API paths will be relative to the host where the OpenAPI
                  definition is loaded from.
                </p>
              </div>
              <Button onClick={addServer}>
                <Plus className="h-4 w-4 mr-2" />
                Create Server
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {servers.map((server, index) => (
            <ServerEditor key={index} server={server} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
