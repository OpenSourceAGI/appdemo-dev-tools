'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOpenAPI, toJson, toYaml, downloadFile, copyToClipboard, postProcessDefinition, generateMcpServerFiles, getToolCount } from '@/lib/openapi';
import { FileJson, FileCode, Download, Copy, Check, Server, Package } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import JSZip from 'jszip';

export function ExportTab() {
  const { spec } = useOpenAPI();
  const [jsonOutput, setJsonOutput] = useState('');
  const [yamlOutput, setYamlOutput] = useState('');
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedYaml, setCopiedYaml] = useState(false);
  const [serverName, setServerName] = useState('my-mcp-server');
  const [serverPort, setServerPort] = useState('3000');
  const [isGenerating, setIsGenerating] = useState(false);
  const [toolCount, setToolCount] = useState(0);

  // Generate outputs when spec changes
  useEffect(() => {
    const processed = postProcessDefinition(spec);
    setJsonOutput(toJson(processed));
    setToolCount(getToolCount(processed));

    toYaml(processed).then(setYamlOutput).catch(() => {
      setYamlOutput('Error generating YAML');
    });
  }, [spec]);

  const handleCopyJson = async () => {
    try {
      await copyToClipboard(jsonOutput);
      setCopiedJson(true);
      toast.success('JSON copied to clipboard');
      setTimeout(() => setCopiedJson(false), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleCopyYaml = async () => {
    try {
      await copyToClipboard(yamlOutput);
      setCopiedYaml(true);
      toast.success('YAML copied to clipboard');
      setTimeout(() => setCopiedYaml(false), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleDownloadJson = () => {
    downloadFile(jsonOutput, 'openapi.json', 'application/json');
    toast.success('Downloaded openapi.json');
  };

  const handleDownloadYaml = () => {
    downloadFile(yamlOutput, 'openapi.yaml', 'text/yaml');
    toast.success('Downloaded openapi.yaml');
  };

  const handleGenerateMcpServer = async () => {
    setIsGenerating(true);
    try {
      const processed = postProcessDefinition(spec);
      const files = generateMcpServerFiles(processed, {
        serverName: serverName || 'my-mcp-server',
        port: parseInt(serverPort) || 3000,
        baseUrl: spec.servers?.[0]?.url,
      });

      // Create zip file using JSZip
      const zip = new JSZip();
      const folderName = serverName || 'my-mcp-server';

      for (const file of files) {
        zip.file(`${folderName}/${file.path}`, file.content);
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${folderName}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Generated ${folderName}.zip with ${files.length} files`);
    } catch (error) {
      console.error('Error generating MCP server:', error);
      toast.error('Failed to generate MCP server');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            <div>
              <CardTitle>Generate MCP Server</CardTitle>
              <CardDescription>
                Create a complete MCP server from your OpenAPI definition
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{toolCount}</div>
              <div className="text-sm text-muted-foreground">MCP Tools</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">8</div>
              <div className="text-sm text-muted-foreground">Files Generated</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold flex items-center justify-center gap-1">
                <Package className="h-5 w-5" />
              </div>
              <div className="text-sm text-muted-foreground">Ready to Deploy</div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="server-name">Server Name</Label>
              <Input
                id="server-name"
                value={serverName}
                onChange={(e) => setServerName(e.target.value.replace(/[^a-zA-Z0-9-_]/g, '-'))}
                placeholder="my-mcp-server"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="server-port">Port</Label>
              <Input
                id="server-port"
                type="number"
                value={serverPort}
                onChange={(e) => setServerPort(e.target.value)}
                placeholder="3000"
              />
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
            <p className="font-medium">Generated server includes:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>MCP server with all API operations as tools</li>
              <li>Built-in Inspector UI at <code>/inspector</code></li>
              <li>HTTP client for API requests</li>
              <li>Environment configuration</li>
              <li>README with setup instructions</li>
            </ul>
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={handleGenerateMcpServer}
            disabled={isGenerating || toolCount === 0}
          >
            {isGenerating ? (
              <>Generating...</>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Generate MCP Server
              </>
            )}
          </Button>
        </CardContent>
      </Card>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Export Definition</h2>
          <p className="text-muted-foreground">
            Download or copy your OpenAPI definition in JSON or YAML format
          </p>
        </div>
      </div>

      <Tabs defaultValue="json" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="json" className="gap-2">
            <FileJson className="h-4 w-4" />
            JSON
          </TabsTrigger>
          <TabsTrigger value="yaml" className="gap-2">
            <FileCode className="h-4 w-4" />
            YAML
          </TabsTrigger>
        </TabsList>

        <TabsContent value="json" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>JSON Output</CardTitle>
                  <CardDescription>Your OpenAPI definition in JSON format</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCopyJson}>
                    {copiedJson ? (
                      <Check className="h-4 w-4 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    {copiedJson ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button onClick={handleDownloadJson}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] w-full rounded-md border">
                <pre className="p-4 text-sm font-mono">
                  <code>{jsonOutput}</code>
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="yaml" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>YAML Output</CardTitle>
                  <CardDescription>Your OpenAPI definition in YAML format</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCopyYaml}>
                    {copiedYaml ? (
                      <Check className="h-4 w-4 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    {copiedYaml ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button onClick={handleDownloadYaml}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] w-full rounded-md border">
                <pre className="p-4 text-sm font-mono">
                  <code>{yamlOutput}</code>
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Export Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{Object.keys(spec.paths || {}).length}</div>
              <div className="text-sm text-muted-foreground">Paths</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {Object.values(spec.paths || {}).reduce((acc, path) => {
                  const methods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace'];
                  return acc + methods.filter((m) => (path as Record<string, unknown>)[m]).length;
                }, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Operations</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {Object.keys(spec.components?.schemas || {}).length}
              </div>
              <div className="text-sm text-muted-foreground">Schemas</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {Math.round(jsonOutput.length / 1024 * 10) / 10}
              </div>
              <div className="text-sm text-muted-foreground">KB (JSON)</div>
            </div>
          </div>
        </CardContent>
      </Card>


    </div>
  );
}
