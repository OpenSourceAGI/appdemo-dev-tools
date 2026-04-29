'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowUp,
  Save,
  Undo2,
  Info,
  Server,
  Lock,
  Tag,
  Code,
  FileJson,
  FileCode,
  Upload,
  Settings,
} from 'lucide-react';
import { OpenAPIProvider, useOpenAPI } from '@/lib/openapi';
import { InfoTab } from './info-tab';
import { ServersTab } from './servers-tab';
import { SecurityTab } from './security-tab';
import { TagsTab } from './tags-tab';
import { PathsTab } from './paths-tab';
import { SchemasTab } from './schemas-tab';
import { ImportTab } from './import-tab';
import { ExportTab } from './export-tab';
import { toast } from 'sonner';

function OpenAPIDesignerContent() {
  const { spec, save, undo } = useOpenAPI();

  const handleSave = () => {
    save();
    toast.success('Saved to local storage');
  };

  const handleUndo = () => {
    undo();
    toast.info('Reverted to last saved state');
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col min-h-full py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Code className="h-5 w-5" />
          <span className="font-semibold text-lg">OpenAPI Designer</span>
          <span className="text-sm text-muted-foreground ml-2">
            {spec.info?.title} v{spec.info?.version}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={scrollToTop}>
            <ArrowUp className="h-4 w-4 mr-1" />
            Top
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
          <Button variant="ghost" size="sm" onClick={handleUndo}>
            <Undo2 className="h-4 w-4 mr-1" />
            Undo
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <Tabs defaultValue="paths" className="w-full">
          <TabsList className="grid w-full grid-cols-8 lg:w-auto lg:inline-flex">
            <TabsTrigger value="import" className="gap-2">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Import</span>
            </TabsTrigger>
            <TabsTrigger value="info" className="gap-2">
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline">Info</span>
            </TabsTrigger>
            <TabsTrigger value="servers" className="gap-2">
              <Server className="h-4 w-4" />
              <span className="hidden sm:inline">Servers</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="tags" className="gap-2">
              <Tag className="h-4 w-4" />
              <span className="hidden sm:inline">Tags</span>
            </TabsTrigger>
            <TabsTrigger value="paths" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Paths</span>
            </TabsTrigger>
            <TabsTrigger value="schemas" className="gap-2">
              <Code className="h-4 w-4" />
              <span className="hidden sm:inline">Schemas</span>
            </TabsTrigger>
            <TabsTrigger value="export" className="gap-2">
              <FileJson className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="import" className="mt-0">
              <ImportTab />
            </TabsContent>

            <TabsContent value="info" className="mt-0">
              <InfoTab />
            </TabsContent>

            <TabsContent value="servers" className="mt-0">
              <ServersTab />
            </TabsContent>

            <TabsContent value="security" className="mt-0">
              <SecurityTab />
            </TabsContent>

            <TabsContent value="tags" className="mt-0">
              <TagsTab />
            </TabsContent>

            <TabsContent value="paths" className="mt-0">
              <PathsTab />
            </TabsContent>

            <TabsContent value="schemas" className="mt-0">
              <SchemasTab />
            </TabsContent>

            <TabsContent value="export" className="mt-0">
              <ExportTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

export function OpenAPIDesigner() {
  return (
    <OpenAPIProvider>
      <OpenAPIDesignerContent />
    </OpenAPIProvider>
  );
}
