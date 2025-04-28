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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);

  const handleSubmit = async () => {
    if (!query.trim()) return; // Don't send empty queries

    setLoading(true);
    setError(null);

    const userMessage: Message = { role: 'user', content: query };
    // Add user message and a placeholder for the assistant message immediately
    setChatHistory((prev) => [...prev, userMessage, { role: 'assistant', content: '' }]);

    setQuery(''); // Clear input immediately after adding user message

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

      let assistantReplyContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantReplyContent += chunk;

        // Update the content of the *last* message in chatHistory
        setChatHistory((prev) => {
          const newHistory = [...prev];
          // Assuming the last message is always the assistant's streaming message
          if (newHistory.length > 0 && newHistory[newHistory.length - 1].role === 'assistant') {
             newHistory[newHistory.length - 1].content = assistantReplyContent;
          }
          return newHistory;
        });

        await new Promise(resolve => setTimeout(resolve, 50)); //Slowing down stream slightly for effect
      }

    } catch (error) {
      console.error(error);
      setError('Failed to get a response from the server.');
      // If an error occurs, remove the placeholder assistant message
       setChatHistory((prev) => {
          const newHistory = [...prev];
           if (newHistory.length > 0 && newHistory[newHistory.length - 1].content === '') {
               newHistory.pop(); // Remove the empty assistant message if streaming failed
           }
           return newHistory;
       });
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
                        // Use a unique key for the highlighter to force re-render during streaming
                        key={idx + '-code-' + String(children).length}
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
        // Allow pressing Enter to submit
         onKeyDown={(e) => {
           if (e.key === 'Enter' && !e.shiftKey) {
             e.preventDefault(); // Prevent newline in textarea
             handleSubmit();
           }
         }}
      />
      <br />
      <button onClick={handleSubmit} disabled={loading || !query.trim()} style={{ marginBottom: 10 }}>
        {loading ? 'Loading...' : 'Submit'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    
    </div>
  );
};

export default App;