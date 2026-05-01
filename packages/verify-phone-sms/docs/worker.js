// Simple worker to serve static Next.js export files
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    let path = url.pathname;
    
    // Default to index.html for root
    if (path === '/') {
      path = '/index.html';
    }
    
    // Try to serve the file from the out directory
    try {
      const file = await env.ASSETS.fetch(new Request(url.origin + path));
      if (file.status === 200) {
        return file;
      }
    } catch (e) {
      // File not found, continue to fallback
    }
    
    // Fallback to index.html for SPA routing
    try {
      const indexFile = await env.ASSETS.fetch(new Request(url.origin + '/index.html'));
      if (indexFile.status === 200) {
        return indexFile;
      }
    } catch (e) {
      // Index file not found
    }
    
    // Return 404
    return new Response('Not Found', { status: 404 });
  }
};
