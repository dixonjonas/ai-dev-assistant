import React, { useState } from 'react';
import axios from 'axios';

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await axios.post('http://localhost:3001/api/query', { query });
      setResponse(res.data.response);
    } catch (error) {
      setError('Failed to get a response from the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>AI Developer Assistant</h1>
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask your question"
      />
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Loading...' : 'Submit'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {response && <p><strong>Response:</strong> {response}</p>}
    </div>
  );
};

export default App;
