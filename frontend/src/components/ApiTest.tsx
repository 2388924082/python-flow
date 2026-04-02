import { useState, useEffect } from 'react';
import { getNodes } from '../services/api';
import type { PluginDefinition } from '../types/api';

function ApiTest() {
  const [nodes, setNodes] = useState<PluginDefinition[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getNodes()
      .then(setNodes)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>API Test</h1>
      <p>Nodes loaded: {nodes.length}</p>
      <ul>
        {nodes.map((n) => (
          <li key={n.id}>
            {n.icon} {n.name} ({n.category})
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ApiTest;
