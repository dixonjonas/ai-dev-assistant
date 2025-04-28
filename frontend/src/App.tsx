import React, { useState } from 'react';
import axios from 'axios';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);

  const handleSubmit = async () => {
    if (!query.trim()) return; // Don't send empty queries

    setLoading(true);
    setError(null);

    try {
      const res = await axios.post('http://localhost:3001/api/query', {
        history: chatHistory,
        query: query,
      });

      const assistantReply = res.data.response;

      // Update history: user question + assistant reply
      setChatHistory((prev) => [
        ...prev,
        { role: 'user', content: query },
        { role: 'assistant', content: assistantReply },
      ]);

      setResponse(assistantReply);
      setQuery(''); // Clear input after sending
    } catch (error) {
      console.error(error);
      setError('Failed to get a response from the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
      <h1>AI Developer Assistant</h1>

      <div style={{ marginBottom: 20 }}>
        {chatHistory.map((msg, idx) => (
          <div key={idx} style={{ marginBottom: 10 }}>
            <strong>{msg.role === 'user' ? 'You' : 'Assistant'}:</strong> {msg.content}
          </div>
        ))}
      </div>

      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask your question..."
        style={{ width: '100%', height: 100, marginBottom: 10 }}
      />
      <br />
      <button onClick={handleSubmit} disabled={loading} style={{ marginBottom: 10 }}>
        {loading ? 'Loading...' : 'Submit'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {response && (
        <div>
          <strong>Latest Response:</strong> {response}
        </div>
      )}
    </div>
  );
};

export default App;
