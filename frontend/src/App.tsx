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
    // Main container: Use flexbox column, take full viewport height
    <div style={{
      maxWidth: 900, // You can adjust this value
      margin: 'auto',
      padding: 20,
      height: '100vh', // Take full viewport height
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box', // Include padding in the height calculation
    }}>
      {/* Define the spinning animation keyframes */}
      {/* Keep this style block if you haven't defined @keyframes spin elsewhere */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      <h1>AI Developer Assistant</h1>

      {/* Chat History Container: Occupy available space and be scrollable */}
      <div style={{
        flex: 1, // Makes this div grow and take up available vertical space
        overflowY: 'auto', // Add scrollbar when content overflows (scrollbar will be on the right of this div)
        paddingBottom: 100, // Add padding at the bottom to prevent content from being hidden by the input area
      }}>
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
                         key={idx + '-code-' + String(children).length} // Use a unique key for streaming updates
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

      {/* Input Area Container: Stays at the bottom */}
      {/* This div is the positioning context for the absolute button and ring */}
      <div style={{
         padding: 10, // Padding inside the border
         backgroundColor: '#fff',
         position: 'relative', // Crucial for positioning the button and ring inside
         borderRadius: 8,
         border: '1px solid #ccc',
         marginTop: 10,
         display: 'flex', // Use flex to manage textarea and potential error below
         flexDirection: 'column',
      }}>
         {/* Textarea */}
         <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask your question..."
            style={{
              width: '100%', // Takes 100% of parent width minus padding
              height: 100,
              padding: 10, // Padding inside textarea
              paddingRight: 50, // Add padding on the right to make space for the button
              marginBottom: 0, // Remove margin bottom from textarea
              display: 'block', // Ensure block behavior for width
              boxSizing: 'border-box', // Include padding in width
              borderRadius: 8, // Rounded corners for the textarea itself
              borderColor: '#eee', // Lighter border for textarea
              resize: 'none', // Prevent manual resizing
              outline: 'none', // Remove outline on focus if desired
              // Remove position/relative/absolute styles
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
         />

         {/* The Spinning Ring Element - Renders only when loading */}
         {loading && (
           <div style={{
             position: 'absolute', // Position relative to the outer container
             // Adjusted position slightly
             bottom: 6, // Adjusted from 6
             right: 6,  // Adjusted from 6
             width: 44, // Ring size
             height: 44, // Ring size
             borderRadius: '50%',
             border: '4px solid rgba(255, 255, 255, 0.3)', // Light gray transparent border
             borderTop: '4px solid #007bff', // Blue top border (the spinning part)
             animation: 'spin 1s linear infinite', // Apply the spin animation
             // Ensure it's visually above the button if needed (though often not necessary)
             // zIndex: 1,
           }}>
           </div>
         )}

         {/* The Button Element - Positioned relative to the outer container */}
         <button
            onClick={handleSubmit}
            disabled={loading || !query.trim()}
            style={{
              position: 'absolute', // Position relative to the outer container
              bottom: 14, // 10px from the inner bottom edge
              right: 14,  // 10px from the inner right edge
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: loading ? '#ccc' : '#007bff',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              transition: 'background-color 0.2s ease',
              // REMOVED: animation style
            }}
            title={loading ? 'Loading...' : 'Send'}
         >
           {/* Simple Send Icon (SVG) */}
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
             <line x1="22" y1="2" x2="11" y2="13"></line>
             <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
           </svg>
         </button>


         {error && <p style={{ color: 'red', marginTop: 10, marginBottom: 0 }}>{error}</p>}
      </div>


    </div>
  );
};

export default App;