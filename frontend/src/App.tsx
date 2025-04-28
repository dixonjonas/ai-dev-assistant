import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Define the structure for a chat message
type Message = {
  role: 'user' | 'assistant';
  content: string;
};

// Define the initial welcome message from the dev assistant
const INITIAL_MESSAGE_CONTENT = "Hi! I am your personal AI-powered dev assistant. " +
                                "Please ask me any developer-related question and I " +
                                "will do my best to answer!";

// Main application
const App: React.FC = () => {
  // State variables to manage the UI and chat data
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);

  // Using useEffect to add the initial welcome message to the chat
  useEffect(() => {
    const initialMessage: Message = {
      role: 'assistant',
      content: INITIAL_MESSAGE_CONTENT,
    };
    // Add the welcome message as the first message in the history
    setChatHistory([initialMessage]);
  }, []); 

  // Async function to handle user query submissions
  const handleSubmit = async () => {
    // Prevent sending empty queries
    if (!query.trim()) return; 

    // Update UI state for loading and clear previous errors
    setLoading(true);
    setError(null); 

    // Add the user message and an empty assistant placeholder to history
    const userMessage: Message = { role: 'user', content: query };
    setChatHistory((prev) => [...prev, userMessage, { role: 'assistant', content: '' }]);

    // Clear input
    setQuery('');


    try {
      // Prepare history for the backend (excluding the welcome message)
      const historyToSend = chatHistory.slice(1);

      // Send the query and history to the backend API
      const backendHost = process.env.REACT_APP_BACKEND_HOST || 'localhost';
      const backendPort = process.env.REACT_APP_BACKEND_PORT || 3001;
      const backendUrl = `http://${backendHost}:${backendPort}/api/query`;
      const res = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          history: historyToSend,
          query: query,
        }),
      });

      // Check for HTTP status codes that indicate errors
      if (!res.ok) {
        let errorDetail = `Status: ${res.status} ${res.statusText || ''}`;
        // Attempt to read the response body for more error details
        try {
          const errorBody = await res.text();
          if (errorBody) {
              try {
                  // Try parsing as JSON
                  const errorJson = JSON.parse(errorBody);
                  errorDetail += ` - ${errorJson.error || JSON.stringify(errorJson)}`;
              } catch (parseError) { 
                  // If JSON parsing fails, use plain text
                  errorDetail += ` - ${errorBody}`;
              }
          }
        } catch (readError) { 
          // Log in console if reading body fails
          console.error('Failed to read error response body:', readError);
        }
        // Throw an error with the collected details
        throw new Error(`Server responded with an error: ${errorDetail}`);
      }
      
      // Ensure there is a readable response body for streaming
      if (!res.body) {
         throw new Error('No response body received.');
      }

      // Get a reader for the response stream and a decoder
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');

      // Stores the assistant's message chunks during streaming
      let assistantReplyContent = '';

      // Read the stream chunk by chunk
      while (true) {
        const { done, value } = await reader.read();
        
        // Check for an empty stream received immediately
        if (done && assistantReplyContent === '' && !loading) {
             // This case might indicate an issue where the stream closed immediately
              throw new Error('Received an empty response stream.');
        }
        // Break when the stream is done
        if (done) break;

        // Decode the chunk and append to the assistant's reply
        const chunk = decoder.decode(value, { stream: true });
        assistantReplyContent += chunk;

        // Update the content of the latest assistant message in history with the new chunk
        setChatHistory((prev) => {
          const newHistory = [...prev];
          if (newHistory.length > 0 && newHistory[newHistory.length - 1].role === 'assistant') {
             newHistory[newHistory.length - 1].content = assistantReplyContent;
          }
          return newHistory;
        });

        // Slowing down the stream slightly for a better streaming effect
        await new Promise(resolve => setTimeout(resolve, 50)); 
      }

      // Error handling
    } catch (error) {
      // Log the error
      console.error('Frontend request failed:', error); 

      // Determine a user-friendly error message based on the error type
      let userMessage = 'An unexpected error occurred. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          userMessage = 'Could not connect to the AI assistant. Please ensure the backend server is running or try again later.';
        } else if (error.message.includes('Server responded with an error:')) {
           userMessage = error.message;
        } else {
           userMessage = `Request failed: ${error.message}`;
        }
      }

      // Display the user-friendly error message
      setError(userMessage);

      // Remove the empty assistant placeholder message from history if the request failed
      setChatHistory((prev) => {
        const newHistory = [...prev];
          // Check if the last message is an empty assistant placeholder
          if (newHistory.length > 0 && newHistory[newHistory.length - 1].role === 'assistant' && newHistory[newHistory.length - 1].content === '') {
            // Remove it if it's not the initial welcome message
            if (newHistory.length > 1) {
              newHistory.pop();
            }
          }
        return newHistory;
      });

    // Reset loading state regardless of success or failure
    } finally {
      setLoading(false);
    }
  };

  // JSX to render the UI
  return (
    // Main container
    <div style={{
      maxWidth: 900, 
      margin: 'auto',
      padding: 20,
      height: '100vh', 
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box', 
    }}>
      {/* Define the spinning loading animation keyframes */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      
      {/* Application Header */}
      <h1 style={{
        color: '#007bff', 
        fontSize: '2em', 
        marginBottom: '20px', 
        textAlign: 'center', 
      }}>
        AI Dev Assistant
      </h1>

      {/* Container for displaying chat messages (scrollable) */}
      <div style={{
        flex: 1, 
        overflowY: 'auto', 
        paddingBottom: 100, 
      }}>
        {/* Map over the chat history array to render each message */}
        {chatHistory.map((msg, idx) => (
          <div key={idx} style={{ marginBottom: 10 }}>
            <strong>{msg.role === 'user' ? 'You' : 'Assistant'}:</strong>
            <div style={{ marginTop: 5, paddingLeft: 10 }}>
              {/* ReactMarkdown component to format message content */}
              <ReactMarkdown
                components={{
                  // Custom component for rendering code blocks (syntax highlighting included)
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
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

      {/* Container for the input area (fixed to the bottom) */}
      <div style={{
         padding: 10, 
         backgroundColor: '#fff',
         position: 'relative', 
         borderRadius: 8,
         border: '1px solid #ccc',
         marginTop: 10,
         display: 'flex', 
         flexDirection: 'column',
      }}>
         {/* User input area */}
         <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask AI Dev Assistant"
            style={{
              width: '100%', 
              height: 100,
              padding: 10, 
              paddingRight: 50, 
              marginBottom: 0, 
              display: 'block', 
              boxSizing: 'border-box', 
              borderRadius: 8, 
              borderColor: '#eee', 
              resize: 'none', 
              outline: 'none', 
            }}
            // Allow pressing Enter for submitting user query
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
         />

         {/* The loading element around the submission button */}
         {loading && (
           <div style={{
             position: 'absolute', 
             bottom: 6, 
             right: 6,  
             width: 44, 
             height: 44, 
             borderRadius: '50%',
             border: '4px solid rgba(255, 255, 255, 0.3)', 
             borderTop: '4px solid #007bff', 
             animation: 'spin 1s linear infinite', 
           }}>
           </div>
         )}

         {/* The submission button element */}
         <button
            onClick={handleSubmit}
            disabled={loading || !query.trim()}
            style={{
              position: 'absolute', 
              bottom: 14, 
              right: 14,
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
            }}
            title={loading ? 'Loading...' : 'Send'}
         >
           {/* The submission button icon */}
           <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
             <line x1="22" y1="2" x2="11" y2="13"></line>
             <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
           </svg>
         </button>

         {/* Display an error message if the 'error' state is not null */}
         {error && <p style={{ color: 'red', marginTop: 10, marginBottom: 0 }}>{error}</p>}
      </div>
    </div>
  );
}; 

// Export the application
export default App;