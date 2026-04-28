'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  useOpenAPI,
  type ParameterObject,
  type HttpMethod,
  DATA_TYPES,
  PARAMETER_LOCATIONS,
  FORMAT_SUGGESTIONS,
} from '@/lib/openapi';
import { Plus, Trash2, ChevronDown, Edit } from 'lucide-react';
import { useState } from 'react';

interface ParameterEditorProps {
  path: string;
  method: HttpMethod;
  parameter: ParameterObject;
  index: number;
}

export function ParameterEditor({ path, method, parameter, index }: ParameterEditorProps) {
  const { dispatch, save } = useOpenAPI();
  const [isOpen, setIsOpen] = useState(false);

  const updateParameter = (updates: Partial<ParameterObject>) => {
    dispatch({
      type: 'UPDATE_PARAMETER',
      payload: {
        path,
        method,
        index,
        parameter: { ...parameter, ...updates },
      },
    });
  };

  const removeParameter = () => {
    save();
    dispatch({
      type: 'REMOVE_PARAMETER',
      payload: { path, method, index },
    });
  };

  const handleLocationChange = (value: ParameterObject['in']) => {
    const updates: Partial<ParameterObject> = { in: value };
    if (value === 'path') {
      updates.required = true;
    }
    updateParameter(updates);
  };

  const handleTypeChange = (value: string) => {
    const currentSchema = parameter.schema || {};
    const schema = { ...currentSchema, type: value as NonNullable<ParameterObject['schema']>['type'] };

    // Handle array type
    if (value === 'array' && currentSchema.type !== 'array') {
      schema.items = { type: 'string' };
    } else if (value !== 'array') {
      delete schema.items;
    }

    updateParameter({ schema });
  };

  const addEnumValue = () => {
    const enumValues = [...(parameter.schema?.enum || []), 'newValue'];
    updateParameter({
      schema: { ...parameter.schema, enum: enumValues },
    });
  };

  const updateEnumValue = (idx: number, value: string) => {
    const enumValues = [...(parameter.schema?.enum || [])];
    enumValues[idx] = value;
    updateParameter({
      schema: { ...parameter.schema, enum: enumValues },
    });
  };

  const removeEnumValue = (idx: number) => {
    const enumValues = (parameter.schema?.enum || []).filter((_, i) => i !== idx);
    updateParameter({
      schema: {
        ...parameter.schema,
        enum: enumValues.length > 0 ? enumValues : undefined,
      },
    });
  };

  const schemaType = parameter.schema?.type || 'string';
  const formats = FORMAT_SUGGESTIONS[schemaType] || [];

  const getLocationBadgeColor = (location: string) => {
    const colors: Record<string, string> = {
      path: 'bg-purple-500/10 text-purple-700',
      query: 'bg-blue-500/10 text-blue-700',
      header: 'bg-amber-500/10 text-amber-700',
      cookie: 'bg-green-500/10 text-green-700',
    };
    return colors[location] || '';
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

            <Badge variant="secondary" className={getLocationBadgeColor(parameter.in)}>
              {parameter.in}
            </Badge>

            <span className="font-mono text-sm flex-1">{parameter.name}</span>

            <Badge variant="outline" className="text-xs">
              {schemaType}
            </Badge>

            {parameter.required && (
              <Badge variant="destructive" className="text-xs">
                required
              </Badge>
            )}

            <Button variant="ghost" size="sm" onClick={removeParameter}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>

          <CollapsibleContent>
            <div className="mt-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Parameter Name *</Label>
                  <Input
                    value={parameter.name}
                    onChange={(e) => updateParameter({ name: e.target.value })}
                    placeholder="parameterName"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location *</Label>
                  <Select value={parameter.in} onValueChange={handleLocationChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PARAMETER_LOCATIONS.map((loc) => (
                        <SelectItem key={loc} value={loc}>
                          {loc.charAt(0).toUpperCase() + loc.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={parameter.description || ''}
                  onChange={(e) => updateParameter({ description: e.target.value })}
                  placeholder="Parameter description (supports Markdown)"
                  rows={2}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Data Type</Label>
                  <Select value={schemaType} onValueChange={handleTypeChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DATA_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formats.length > 0 && (
                  <div className="space-y-2">
                    <Label>Format</Label>
                    <Select
                      value={parameter.schema?.format || ''}
                      onValueChange={(v) =>
                        updateParameter({
                          schema: { ...parameter.schema, format: v || undefined },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select format..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {formats.map((format) => (
                          <SelectItem key={format} value={format}>
                            {format}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`required-${index}`}
                    checked={parameter.required || false}
                    onCheckedChange={(checked) => updateParameter({ required: !!checked })}
                    disabled={parameter.in === 'path'}
                  />
                  <Label htmlFor={`required-${index}`} className="cursor-pointer">
                    Required
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`deprecated-${index}`}
                    checked={parameter.deprecated || false}
                    onCheckedChange={(checked) => updateParameter({ deprecated: !!checked })}
                  />
                  <Label htmlFor={`deprecated-${index}`} className="cursor-pointer">
                    Deprecated
                  </Label>
                </div>
                {parameter.in === 'query' && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`allowEmpty-${index}`}
                      checked={parameter.allowEmptyValue || false}
                      onCheckedChange={(checked) =>
                        updateParameter({ allowEmptyValue: !!checked })
                      }
                    />
                    <Label htmlFor={`allowEmpty-${index}`} className="cursor-pointer">
                      Allow Empty
                    </Label>
                  </div>
                )}
              </div>

              {/* Type-specific fields */}
              {schemaType !== 'object' && schemaType !== 'array' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Default Value</Label>
                    <Button variant="outline" size="sm" onClick={addEnumValue}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add Enum
                    </Button>
                  </div>
                  <Input
                    value={String(parameter.schema?.default || '')}
                    onChange={(e) =>
                      updateParameter({
                        schema: { ...parameter.schema, default: e.target.value },
                      })
                    }
                    placeholder="Default value"
                  />

                  {parameter.schema?.enum && parameter.schema.enum.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs">Enum Values</Label>
                      <div className="flex flex-wrap gap-2">
                        {parameter.schema.enum.map((val, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <Input
                              value={String(val)}
                              onChange={(e) => updateEnumValue(idx, e.target.value)}
                              className="w-24 h-8"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => removeEnumValue(idx)}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {schemaType === 'string' && (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Min Length</Label>
                    <Input
                      type="number"
                      min={0}
                      value={parameter.schema?.minLength || ''}
                      onChange={(e) =>
                        updateParameter({
                          schema: {
                            ...parameter.schema,
                            minLength: e.target.value ? parseInt(e.target.value) : undefined,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Length</Label>
                    <Input
                      type="number"
                      min={0}
                      value={parameter.schema?.maxLength || ''}
                      onChange={(e) =>
                        updateParameter({
                          schema: {
                            ...parameter.schema,
                            maxLength: e.target.value ? parseInt(e.target.value) : undefined,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pattern (Regex)</Label>
                    <Input
                      value={parameter.schema?.pattern || ''}
                      onChange={(e) =>
                        updateParameter({
                          schema: {
                            ...parameter.schema,
                            pattern: e.target.value || undefined,
                          },
                        })
                      }
                      placeholder="^[a-z]+$"
                    />
                  </div>
                </div>
              )}

              {(schemaType === 'integer' || schemaType === 'number') && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label>Minimum</Label>
                      <Checkbox
                        id={`minExclusive-${index}`}
                        checked={parameter.schema?.exclusiveMinimum || false}
                        onCheckedChange={(checked) =>
                          updateParameter({
                            schema: {
                              ...parameter.schema,
                              exclusiveMinimum: !!checked,
                            },
                          })
                        }
                      />
                      <Label htmlFor={`minExclusive-${index}`} className="text-xs">
                        Exclusive
                      </Label>
                    </div>
                    <Input
                      type="number"
                      value={parameter.schema?.minimum ?? ''}
                      onChange={(e) =>
                        updateParameter({
                          schema: {
                            ...parameter.schema,
                            minimum: e.target.value ? parseFloat(e.target.value) : undefined,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label>Maximum</Label>
                      <Checkbox
                        id={`maxExclusive-${index}`}
                        checked={parameter.schema?.exclusiveMaximum || false}
                        onCheckedChange={(checked) =>
                          updateParameter({
                            schema: {
                              ...parameter.schema,
                              exclusiveMaximum: !!checked,
                            },
                          })
                        }
                      />
                      <Label htmlFor={`maxExclusive-${index}`} className="text-xs">
                        Exclusive
                      </Label>
                    </div>
                    <Input
                      type="number"
                      value={parameter.schema?.maximum ?? ''}
                      onChange={(e) =>
                        updateParameter({
                          schema: {
                            ...parameter.schema,
                            maximum: e.target.value ? parseFloat(e.target.value) : undefined,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
}
