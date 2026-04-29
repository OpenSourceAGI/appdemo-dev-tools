'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useOpenAPI, type SecuritySchemeObject, type OAuthFlowObject, SECURITY_SCHEME_TYPES } from '@/lib/openapi';
import { Plus, Trash2, ChevronDown, Lock, Key, Shield } from 'lucide-react';
import { useState } from 'react';

interface OAuthFlowEditorProps {
  flowName: string;
  flow: OAuthFlowObject;
  onUpdate: (flow: OAuthFlowObject) => void;
  onRemove: () => void;
}

function OAuthFlowEditor({ flowName, flow, onUpdate, onRemove }: OAuthFlowEditorProps) {
  const addScope = () => {
    const scopes = { ...flow.scopes, newScope: 'Scope description' };
    onUpdate({ ...flow, scopes });
  };

  const updateScope = (oldName: string, newName: string, description: string) => {
    const scopes = { ...flow.scopes };
    if (oldName !== newName) {
      delete scopes[oldName];
    }
    scopes[newName] = description;
    onUpdate({ ...flow, scopes });
  };

  const removeScope = (name: string) => {
    const scopes = { ...flow.scopes };
    delete scopes[name];
    onUpdate({ ...flow, scopes });
  };

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium capitalize">{flowName} Flow</h4>
        <Button variant="ghost" size="sm" onClick={onRemove}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {(flowName === 'implicit' || flowName === 'authorizationCode') && (
          <div className="space-y-2">
            <Label>Authorization URL</Label>
            <Input
              type="url"
              value={flow.authorizationUrl || ''}
              onChange={(e) => onUpdate({ ...flow, authorizationUrl: e.target.value })}
              placeholder="https://auth.example.com/authorize"
            />
          </div>
        )}
        {(flowName === 'password' || flowName === 'clientCredentials' || flowName === 'authorizationCode') && (
          <div className="space-y-2">
            <Label>Token URL</Label>
            <Input
              type="url"
              value={flow.tokenUrl || ''}
              onChange={(e) => onUpdate({ ...flow, tokenUrl: e.target.value })}
              placeholder="https://auth.example.com/token"
            />
          </div>
        )}
        <div className="space-y-2">
          <Label>Refresh URL</Label>
          <Input
            type="url"
            value={flow.refreshUrl || ''}
            onChange={(e) => onUpdate({ ...flow, refreshUrl: e.target.value })}
            placeholder="https://auth.example.com/refresh"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Scopes</Label>
          <Button variant="outline" size="sm" onClick={addScope}>
            <Plus className="h-3 w-3 mr-1" />
            Add Scope
          </Button>
        </div>

        {Object.keys(flow.scopes || {}).length === 0 ? (
          <p className="text-sm text-muted-foreground">No scopes defined for this flow.</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(flow.scopes || {}).map(([name, desc]) => (
              <ScopeEditor
                key={name}
                name={name}
                description={desc}
                onUpdate={(newName, description) => updateScope(name, newName, description)}
                onRemove={() => removeScope(name)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ScopeEditorProps {
  name: string;
  description: string;
  onUpdate: (name: string, description: string) => void;
  onRemove: () => void;
}

function ScopeEditor({ name, description, onUpdate, onRemove }: ScopeEditorProps) {
  const [localName, setLocalName] = useState(name);
  const [localDesc, setLocalDesc] = useState(description);

  const handleBlur = () => {
    if (localName !== name || localDesc !== description) {
      onUpdate(localName, localDesc);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        value={localName}
        onChange={(e) => setLocalName(e.target.value)}
        onBlur={handleBlur}
        placeholder="scope:name"
        className="flex-1"
      />
      <Input
        value={localDesc}
        onChange={(e) => setLocalDesc(e.target.value)}
        onBlur={handleBlur}
        placeholder="Scope description"
        className="flex-1"
      />
      <Button variant="ghost" size="sm" onClick={onRemove}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

interface SecuritySchemeEditorProps {
  name: string;
  scheme: SecuritySchemeObject;
}

function SecuritySchemeEditor({ name, scheme }: SecuritySchemeEditorProps) {
  const { spec, dispatch } = useOpenAPI();
  const [isOpen, setIsOpen] = useState(true);
  const [localName, setLocalName] = useState(name);

  const isGloballyApplied = spec.security?.some((req) => name in req) || false;

  const updateScheme = (updates: Partial<SecuritySchemeObject>) => {
    dispatch({
      type: 'UPDATE_SECURITY_SCHEME',
      payload: { name, scheme: { ...scheme, ...updates } },
    });
  };

  const handleNameBlur = () => {
    if (localName !== name && localName.trim()) {
      dispatch({
        type: 'RENAME_SECURITY_SCHEME',
        payload: { oldName: name, newName: localName },
      });
    }
  };

  const removeScheme = () => {
    dispatch({ type: 'REMOVE_SECURITY_SCHEME', payload: name });
  };

  const toggleGlobalSecurity = (enabled: boolean) => {
    dispatch({
      type: 'TOGGLE_GLOBAL_SECURITY',
      payload: { schemeName: name, enabled },
    });
  };

  const handleTypeChange = (newType: SecuritySchemeObject['type']) => {
    const newScheme: SecuritySchemeObject = { type: newType };

    if (newType === 'apiKey') {
      newScheme.name = 'api_key';
      newScheme.in = 'query';
    } else if (newType === 'http') {
      newScheme.scheme = 'bearer';
    } else if (newType === 'oauth2') {
      newScheme.flows = {};
    } else if (newType === 'openIdConnect') {
      newScheme.openIdConnectUrl = '';
    }

    dispatch({
      type: 'UPDATE_SECURITY_SCHEME',
      payload: { name, scheme: newScheme },
    });
  };

  const toggleOAuthFlow = (flowName: keyof NonNullable<SecuritySchemeObject['flows']>, enabled: boolean) => {
    const flows = { ...scheme.flows };
    if (enabled) {
      flows[flowName] = { scopes: {} };
    } else {
      delete flows[flowName];
    }
    updateScheme({ flows });
  };

  const updateOAuthFlow = (flowName: keyof NonNullable<SecuritySchemeObject['flows']>, flow: OAuthFlowObject) => {
    updateScheme({
      flows: {
        ...scheme.flows,
        [flowName]: flow,
      },
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
              <Key className="h-4 w-4" />
              <CardTitle className="text-lg">{name}</CardTitle>
            </CollapsibleTrigger>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm">
                <Checkbox
                  id={`global-${name}`}
                  checked={isGloballyApplied}
                  onCheckedChange={toggleGlobalSecurity}
                />
                <Label htmlFor={`global-${name}`} className="text-xs cursor-pointer">
                  Apply globally
                </Label>
              </div>
              <Button variant="ghost" size="sm" onClick={removeScheme}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
          <CardDescription className="capitalize">{scheme.type}</CardDescription>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Scheme Name</Label>
                <Input
                  value={localName}
                  onChange={(e) => setLocalName(e.target.value)}
                  onBlur={handleNameBlur}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={scheme.type} onValueChange={handleTypeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apiKey">API Key</SelectItem>
                    <SelectItem value="http">HTTP Authentication</SelectItem>
                    <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                    <SelectItem value="openIdConnect">OpenID Connect</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* API Key specific fields */}
            {scheme.type === 'apiKey' && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Parameter Name</Label>
                  <Input
                    value={scheme.name || ''}
                    onChange={(e) => updateScheme({ name: e.target.value })}
                    placeholder="X-API-Key"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Select
                    value={scheme.in || 'query'}
                    onValueChange={(v: 'query' | 'header' | 'cookie') => updateScheme({ in: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="header">Header</SelectItem>
                      <SelectItem value="query">Query</SelectItem>
                      <SelectItem value="cookie">Cookie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* HTTP Authentication specific fields */}
            {scheme.type === 'http' && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Scheme</Label>
                  <Input
                    value={scheme.scheme || ''}
                    onChange={(e) => updateScheme({ scheme: e.target.value })}
                    placeholder="bearer"
                  />
                </div>
                {scheme.scheme?.toLowerCase() === 'bearer' && (
                  <div className="space-y-2">
                    <Label>Bearer Format</Label>
                    <Input
                      value={scheme.bearerFormat || ''}
                      onChange={(e) => updateScheme({ bearerFormat: e.target.value })}
                      placeholder="JWT"
                    />
                  </div>
                )}
              </div>
            )}

            {/* OpenID Connect specific fields */}
            {scheme.type === 'openIdConnect' && (
              <div className="space-y-2">
                <Label>OpenID Connect URL *</Label>
                <Input
                  type="url"
                  value={scheme.openIdConnectUrl || ''}
                  onChange={(e) => updateScheme({ openIdConnectUrl: e.target.value })}
                  placeholder="https://auth.example.com/.well-known/openid-configuration"
                />
              </div>
            )}

            {/* OAuth 2.0 specific fields */}
            {scheme.type === 'oauth2' && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`flow-implicit-${name}`}
                      checked={!!scheme.flows?.implicit}
                      onCheckedChange={(checked) => toggleOAuthFlow('implicit', !!checked)}
                    />
                    <Label htmlFor={`flow-implicit-${name}`} className="cursor-pointer">
                      Implicit
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`flow-password-${name}`}
                      checked={!!scheme.flows?.password}
                      onCheckedChange={(checked) => toggleOAuthFlow('password', !!checked)}
                    />
                    <Label htmlFor={`flow-password-${name}`} className="cursor-pointer">
                      Password
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`flow-clientCredentials-${name}`}
                      checked={!!scheme.flows?.clientCredentials}
                      onCheckedChange={(checked) => toggleOAuthFlow('clientCredentials', !!checked)}
                    />
                    <Label htmlFor={`flow-clientCredentials-${name}`} className="cursor-pointer">
                      Client Credentials
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`flow-authorizationCode-${name}`}
                      checked={!!scheme.flows?.authorizationCode}
                      onCheckedChange={(checked) => toggleOAuthFlow('authorizationCode', !!checked)}
                    />
                    <Label htmlFor={`flow-authorizationCode-${name}`} className="cursor-pointer">
                      Authorization Code
                    </Label>
                  </div>
                </div>

                {scheme.flows && Object.entries(scheme.flows).map(([flowName, flow]) => (
                  <OAuthFlowEditor
                    key={flowName}
                    flowName={flowName}
                    flow={flow}
                    onUpdate={(updated) => updateOAuthFlow(flowName as keyof NonNullable<SecuritySchemeObject['flows']>, updated)}
                    onRemove={() => toggleOAuthFlow(flowName as keyof NonNullable<SecuritySchemeObject['flows']>, false)}
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

export function SecurityTab() {
  const { spec, dispatch } = useOpenAPI();
  const schemes = spec.components?.securitySchemes || {};

  const addSecurityScheme = () => {
    dispatch({ type: 'ADD_SECURITY_SCHEME' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Security Schemes</h2>
          <p className="text-muted-foreground">
            Define authentication and authorization methods for your API
          </p>
        </div>
        <Button onClick={addSecurityScheme}>
          <Plus className="h-4 w-4 mr-2" />
          Add Security Scheme
        </Button>
      </div>

      {Object.keys(schemes).length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Shield className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">No Security Schemes</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Define how your API is secured using API keys, OAuth 2.0, or other methods.
                </p>
              </div>
              <Button onClick={addSecurityScheme}>
                <Plus className="h-4 w-4 mr-2" />
                Create Security Scheme
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(schemes).map(([name, scheme]) => (
            <SecuritySchemeEditor key={name} name={name} scheme={scheme} />
          ))}
        </div>
      )}
    </div>
  );
}
