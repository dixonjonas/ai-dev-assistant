import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

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
    setResponse(''); // Start with empty response
  
    try {
      const res = await fetch('http://localhost:3001/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          history: chatHistory,
          query: query,
        }),
      });
  
      if (!res.body) throw new Error('No response body');
  
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
  
      let assistantReply = '';
  
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
  
        const chunk = decoder.decode(value, { stream: true });
        assistantReply += chunk;
        
        // Slowing down the stream slightly
        await new Promise(resolve => setTimeout(resolve, 100));
  
        // As the assistant types, we update the latest message
        setResponse((prev) => (prev || '') + chunk);
      }
  
      // When streaming is finished, update full chat history
      setChatHistory((prev) => [
        ...prev,
        { role: 'user', content: query },
        { role: 'assistant', content: assistantReply },
      ]);
  
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
            <strong>{msg.role === 'user' ? 'You' : 'Assistant'}:</strong>
            <div style={{ marginTop: 5, paddingLeft: 10 }}>
              <ReactMarkdown
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={oneDark}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {msg.content}
              </ReactMarkdown>
            </div>
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
        <div style={{ marginTop: 20 }}>
          <strong>Latest Response:</strong>
          <div style={{ marginTop: 5, paddingLeft: 10 }}>
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={oneDark}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {response}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
