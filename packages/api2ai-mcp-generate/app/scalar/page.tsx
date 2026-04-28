'use client';

import { useEffect, useState } from 'react';
import '@scalar/api-reference/style.css';

const STORAGE_KEY = 'openapi3';

export default function ScalarPage() {
  const [spec, setSpec] = useState<object | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load spec from localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSpec(JSON.parse(stored));
      } catch {
        console.error('Failed to parse stored OpenAPI spec');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!spec || loading) return;

    // Dynamically load and render Scalar
    const container = document.getElementById('scalar-container');
    if (!container) return;

    // Clear previous content
    container.innerHTML = '';

    // Create script element for Scalar
    const scriptEl = document.createElement('script');
    scriptEl.id = 'api-reference';
    scriptEl.type = 'application/json';
    scriptEl.textContent = JSON.stringify(spec);
    container.appendChild(scriptEl);

    // Load Scalar script
    const scalarScript = document.createElement('script');
    scalarScript.src = 'https://cdn.jsdelivr.net/npm/@scalar/api-reference';
    scalarScript.async = true;
    container.appendChild(scalarScript);

    return () => {
      container.innerHTML = '';
    };
  }, [spec, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading API Preview...</div>
      </div>
    );
  }

  if (!spec) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-lg">No OpenAPI spec found</div>
        <p className="text-muted-foreground">
          Please create or import an OpenAPI spec in the dashboard first.
        </p>
        <a href="/dashboard" className="text-primary hover:underline">
          Go to Dashboard
        </a>
      </div>
    );
  }

  return <div id="scalar-container" className="min-h-screen" />;
}
