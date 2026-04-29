'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useOpenAPI, type CallbackObject, type PathItemObject, type HttpMethod, HTTP_METHODS } from '@/lib/openapi';
import { Plus, Trash2, ChevronDown, Webhook } from 'lucide-react';
import { useState } from 'react';

interface CallbacksEditorProps {
  path: string;
  method: HttpMethod;
  callbacks: Record<string, CallbackObject> | undefined;
}

interface CallbackExpressionEditorProps {
  callbackName: string;
  expressionName: string;
  pathItem: PathItemObject;
  onUpdate: (newExpression: string, pathItem: PathItemObject) => void;
  onRemove: () => void;
  onAddOperation: () => void;
}

function CallbackExpressionEditor({
  callbackName,
  expressionName,
  pathItem,
  onUpdate,
  onRemove,
  onAddOperation,
}: CallbackExpressionEditorProps) {
  const [localExpression, setLocalExpression] = useState(expressionName);
  const [isOpen, setIsOpen] = useState(false);

  const operations = HTTP_METHODS.filter((m) => pathItem[m]);

  const handleBlur = () => {
    if (localExpression !== expressionName) {
      onUpdate(localExpression, pathItem);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border rounded-lg p-3 space-y-2">
        <div className="flex items-center gap-2">
          <CollapsibleTrigger className="hover:text-primary">
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isOpen ? '' : '-rotate-90'}`}
            />
          </CollapsibleTrigger>
          <Badge variant="outline">Expression</Badge>
          <Input
            value={localExpression}
            onChange={(e) => setLocalExpression(e.target.value)}
            onBlur={handleBlur}
            placeholder="{$request.body#/callbackUrl}"
            className="flex-1 font-mono text-xs"
          />
          <Button variant="ghost" size="sm" onClick={onRemove}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>

        <CollapsibleContent>
          <div className="mt-3 pl-6 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Operations</Label>
              {operations.length === 0 && (
                <Button variant="outline" size="sm" onClick={onAddOperation}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Operation
                </Button>
              )}
            </div>
            {operations.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {operations.map((m) => (
                  <Badge key={m} variant="secondary" className="text-xs">
                    {m.toUpperCase()}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No operations defined for this callback expression.
              </p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

interface SingleCallbackEditorProps {
  callbackName: string;
  callback: CallbackObject;
  onRename: (newName: string) => void;
  onUpdate: (callback: CallbackObject) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

function SingleCallbackEditor({
  callbackName,
  callback,
  onRename,
  onUpdate,
  onRemove,
  onDuplicate,
}: SingleCallbackEditorProps) {
  const [localName, setLocalName] = useState(callbackName);
  const [isOpen, setIsOpen] = useState(true);

  const handleNameBlur = () => {
    if (localName !== callbackName && localName.trim()) {
      onRename(localName);
    }
  };

  const addExpression = () => {
    const newCallback = { ...callback, '{$url}': {} };
    onUpdate(newCallback);
  };

  const updateExpression = (oldExp: string, newExp: string, pathItem: PathItemObject) => {
    const newCallback = { ...callback };
    if (oldExp !== newExp) {
      delete newCallback[oldExp];
    }
    newCallback[newExp] = pathItem;
    onUpdate(newCallback);
  };

  const removeExpression = (exp: string) => {
    const newCallback = { ...callback };
    delete newCallback[exp];
    onUpdate(newCallback);
  };

  const addOperationToExpression = (exp: string) => {
    const pathItem = callback[exp] || {};
    const newPathItem = {
      ...pathItem,
      post: {
        summary: 'Callback operation',
        responses: { '200': { description: 'Callback received' } },
        parameters: [],
      },
    };
    const newCallback = { ...callback, [exp]: newPathItem };
    onUpdate(newCallback);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center gap-2">
            <CollapsibleTrigger className="hover:text-primary">
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isOpen ? '' : '-rotate-90'}`}
              />
            </CollapsibleTrigger>
            <Webhook className="h-4 w-4 text-muted-foreground" />
            <Input
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              onBlur={handleNameBlur}
              placeholder="callbackName"
              className="flex-1"
            />
            <Button variant="ghost" size="sm" onClick={onDuplicate} title="Duplicate">
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onRemove}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>

          <CollapsibleContent>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-medium">URL Expressions</Label>
                <Button variant="outline" size="sm" onClick={addExpression}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Expression
                </Button>
              </div>

              {Object.keys(callback).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No expressions defined. Add a URL expression to configure the callback.
                </p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(callback).map(([exp, pathItem]) => (
                    <CallbackExpressionEditor
                      key={exp}
                      callbackName={callbackName}
                      expressionName={exp}
                      pathItem={pathItem}
                      onUpdate={(newExp, pi) => updateExpression(exp, newExp, pi)}
                      onRemove={() => removeExpression(exp)}
                      onAddOperation={() => addOperationToExpression(exp)}
                    />
                  ))}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
}

export function CallbacksEditor({ path, method, callbacks }: CallbacksEditorProps) {
  const { dispatch, save } = useOpenAPI();

  const addCallback = () => {
    const currentCallbacks = callbacks || {};
    let name = 'newCallback';
    let counter = 1;
    while (currentCallbacks[name]) {
      name = `newCallback${counter++}`;
    }

    dispatch({
      type: 'UPDATE_OPERATION',
      payload: {
        path,
        method,
        operation: {
          callbacks: {
            ...currentCallbacks,
            [name]: { '{$url}': {} },
          },
        },
      },
    });
  };

  const updateCallback = (oldName: string, newName: string, callback: CallbackObject) => {
    const currentCallbacks = { ...callbacks };
    if (oldName !== newName) {
      delete currentCallbacks[oldName];
    }
    currentCallbacks[newName] = callback;

    dispatch({
      type: 'UPDATE_OPERATION',
      payload: {
        path,
        method,
        operation: { callbacks: currentCallbacks },
      },
    });
  };

  const removeCallback = (name: string) => {
    save();
    const currentCallbacks = { ...callbacks };
    delete currentCallbacks[name];

    dispatch({
      type: 'UPDATE_OPERATION',
      payload: {
        path,
        method,
        operation: {
          callbacks: Object.keys(currentCallbacks).length > 0 ? currentCallbacks : undefined,
        },
      },
    });
  };

  const duplicateCallback = (name: string) => {
    const currentCallbacks = callbacks || {};
    let newName = 'newCallback';
    let counter = 1;
    while (currentCallbacks[newName]) {
      newName = `newCallback${counter++}`;
    }

    dispatch({
      type: 'UPDATE_OPERATION',
      payload: {
        path,
        method,
        operation: {
          callbacks: {
            ...currentCallbacks,
            [newName]: JSON.parse(JSON.stringify(currentCallbacks[name])),
          },
        },
      },
    });
  };

  if (!callbacks || Object.keys(callbacks).length === 0) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="py-6 text-center">
          <Webhook className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-4">
            No callbacks defined. Callbacks allow you to define webhook endpoints that will be
            called when certain events occur.
          </p>
          <Button onClick={addCallback}>
            <Plus className="h-4 w-4 mr-2" />
            Create Callback
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="font-medium">Callbacks</Label>
        <Button variant="outline" size="sm" onClick={addCallback}>
          <Plus className="h-4 w-4 mr-1" />
          Add Callback
        </Button>
      </div>

      <div className="space-y-3">
        {Object.entries(callbacks).map(([name, callback]) => (
          <SingleCallbackEditor
            key={name}
            callbackName={name}
            callback={callback}
            onRename={(newName) => updateCallback(name, newName, callback)}
            onUpdate={(cb) => updateCallback(name, name, cb)}
            onRemove={() => removeCallback(name)}
            onDuplicate={() => duplicateCallback(name)}
          />
        ))}
      </div>
    </div>
  );
}
