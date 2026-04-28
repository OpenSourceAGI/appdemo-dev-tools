'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOpenAPI, COMMON_LICENSES } from '@/lib/openapi';
import { User, Mail, Link, FileText, Scale } from 'lucide-react';

export function InfoTab() {
  const { spec, dispatch } = useOpenAPI();
  const info = spec.info;

  const updateInfo = (updates: Partial<typeof info>) => {
    dispatch({ type: 'UPDATE_INFO', payload: updates });
  };

  const updateExternalDocs = (updates: Partial<NonNullable<typeof spec.externalDocs>>) => {
    dispatch({ type: 'UPDATE_EXTERNAL_DOCS', payload: updates });
  };

  const handleLicenseSelect = (value: string) => {
    const license = COMMON_LICENSES.find((l) => l.name === value);
    if (license) {
      updateInfo({ license: { name: license.name, url: license.url } });
    } else {
      updateInfo({ license: { ...info.license, name: value } });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Required information about your API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="API Title"
                value={info.title || ''}
                onChange={(e) => updateInfo({ title: e.target.value })}
                className={!info.title ? 'border-destructive' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="version">Version *</Label>
              <Input
                id="version"
                placeholder="1.0.0"
                value={info.version || ''}
                onChange={(e) => updateInfo({ version: e.target.value })}
                className={!info.version ? 'border-destructive' : ''}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="A description of your API (supports Markdown)"
              value={info.description || ''}
              onChange={(e) => updateInfo({ description: e.target.value })}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="contactName">Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="contactName"
                  placeholder="Contact Name"
                  value={info.contact?.name || ''}
                  onChange={(e) => updateInfo({ contact: { ...info.contact, name: e.target.value } })}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="contact@example.com"
                  value={info.contact?.email || ''}
                  onChange={(e) => updateInfo({ contact: { ...info.contact, email: e.target.value } })}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactUrl">URL</Label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="contactUrl"
                  type="url"
                  placeholder="https://example.com"
                  value={info.contact?.url || ''}
                  onChange={(e) => updateInfo({ contact: { ...info.contact, url: e.target.value } })}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            License
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="licenseName">License Name</Label>
              <div className="flex gap-2">
                <Input
                  id="licenseName"
                  placeholder="MIT"
                  value={info.license?.name || ''}
                  onChange={(e) => updateInfo({ license: { ...info.license, name: e.target.value } })}
                  className="flex-1"
                />
                <Select onValueChange={handleLicenseSelect}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Choose..." />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_LICENSES.map((license) => (
                      <SelectItem key={license.name} value={license.name}>
                        {license.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="licenseUrl">License URL</Label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="licenseUrl"
                  type="url"
                  placeholder="https://opensource.org/licenses/MIT"
                  value={info.license?.url || ''}
                  onChange={(e) => updateInfo({ license: { ...info.license, url: e.target.value } })}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="termsOfService">Terms of Service URL</Label>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="termsOfService"
                type="url"
                placeholder="https://example.com/terms"
                value={info.termsOfService || ''}
                onChange={(e) => updateInfo({ termsOfService: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            External Documentation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="externalDocsDesc">Description</Label>
            <Textarea
              id="externalDocsDesc"
              placeholder="Description of external documentation (supports Markdown)"
              value={spec.externalDocs?.description || ''}
              onChange={(e) => updateExternalDocs({ description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="externalDocsUrl">Documentation URL</Label>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="externalDocsUrl"
                type="url"
                placeholder="https://docs.example.com"
                value={spec.externalDocs?.url || ''}
                onChange={(e) => updateExternalDocs({ url: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
