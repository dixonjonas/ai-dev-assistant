//Imports
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

// Define the initial message content as a constant
const INITIAL_MESSAGE_CONTENT = "Hi! I am your personal AI-powered dev assistant. " +
                                "Please ask me any developer-related question and I " +
                                "will do my best to answer!";

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Initialize chatHistory as empty; the initial message will be added via useEffect
  const [chatHistory, setChatHistory] = useState<Message[]>([]);

  // Use useEffect to add the initial message to chatHistory when the component mounts
  useEffect(() => {
    const initialMessage: Message = {
      role: 'assistant',
      content: INITIAL_MESSAGE_CONTENT,
    };
    // Add the initial message as the first message in the history
    setChatHistory([initialMessage]);
  }, []); // The empty dependency array [] ensures this effect runs only once on mount


  const handleSubmit = async () => {
    if (!query.trim()) return; // Don't send empty queries

    setLoading(true);
    setError(null); // Clear any previous errors on new submission

    const userMessage: Message = { role: 'user', content: query };
    // Add user message and a placeholder for the assistant message immediately
    // The initial message is already in chatHistory, so append new messages
    setChatHistory((prev) => [...prev, userMessage, { role: 'assistant', content: '' }]);

    // Clear input immediately after adding user message
    setQuery('');

    try {
      // IMPORTANT: Send the history *excluding* the initial message (the first element)
      // to the backend, as it's just a frontend welcome
      const historyToSend = chatHistory.slice(1);

      const res = await fetch('http://localhost:3001/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          history: historyToSend, // Send history excluding the initial message
          query: query,
        }),
      });

      // *** Added: Check for non-OK HTTP status before attempting to stream ***
      if (!res.ok) {
        let errorDetail = `Status: ${res.status} ${res.statusText || ''}`;
        try {
          // Attempt to read a non-streaming error body for more info
          // Use res.json() if your backend sends JSON errors, otherwise res.text()
          const errorBody = await res.text();
          if (errorBody) {
              // Try parsing as JSON in case backend sends { error: "..." }
              try {
                  const errorJson = JSON.parse(errorBody);
                   errorDetail += ` - ${errorJson.error || JSON.stringify(errorJson)}`;
              } catch (parseError) {
                  // If not JSON, just append the text body
                   errorDetail += ` - ${errorBody}`;
              }
          }
        } catch (readError) {
          console.error('Failed to read error response body:', readError);
          // If reading the body fails, the basic status info is all we have
        }
        // Throw an error with more detail which will be caught below
        throw new Error(`Server responded with an error: ${errorDetail}`);
      }
      // *** End Added Check ***


      if (!res.body) {
         throw new Error('No response body received.'); // More specific message
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let assistantReplyContent = '';

      while (true) {
        const { done, value } = await reader.read();
        // If done is true before receiving any content and not loading, might be an empty stream
        if (done && assistantReplyContent === '' && !loading) {
             // This case might indicate an issue where the stream closed immediately
              throw new Error('Received an empty response stream.');
        }
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

      // If the loop finishes successfully, the full message is in chatHistory

    } catch (error) {
      console.error('Frontend request failed:', error); // Log the technical error

      let userMessage = 'An unexpected error occurred. Please try again.'; // Default fallback message

      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          // This specific message often indicates a network error or server is down
          userMessage = 'Could not connect to the AI assistant. Please ensure the backend server is running or try again later.';
        } else if (error.message.includes('Server responded with an error:')) {
           // Use the more detailed error message we added earlier for server-side errors
           userMessage = error.message;
        } else {
           // For other types of errors caught
           userMessage = `Request failed: ${error.message}`;
        }
      }

      // Set the more user-friendly message in the state
      setError(userMessage);

      // Keep the logic to remove the placeholder assistant message if needed
       setChatHistory((prev) => {
          const newHistory = [...prev];
           // Check if the last message is an assistant placeholder with no content
           if (newHistory.length > 0 && newHistory[newHistory.length - 1].role === 'assistant' && newHistory[newHistory.length - 1].content === '') {
               // Only remove it if it's not the initial welcome message (check length > 1)
               if (newHistory.length > 1) {
                 newHistory.pop();
               }
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
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      <h1 style={{
        color: '#007bff', // Use the button's blue color
        fontSize: '2em', // Make it a bit larger
        marginBottom: '20px', // Ensure space below the header
        textAlign: 'center', // Center the text
      }}>
        AI Dev Assistant
      </h1>

      {/* --- REMOVED: The static Initial Assistant Message JSX block is removed --- */}


      {/* Chat History Container: Occupy available space and be scrollable */}
      <div style={{
        flex: 1, // Makes this div grow and take up available vertical space
        overflowY: 'auto', // Add scrollbar when content overflows (scrollbar will be on the right of this div)
        paddingBottom: 100, // Add padding at the bottom to prevent content from being hidden by the input area
      }}>
        {/* This map now includes the initial message because it's in chatHistory */}
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
             bottom: 6, // Adjusted from 6 - reverted to 6, let's trust the math for now
             right: 6,  // Adjusted from 6 - reverted to 6
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


         {error && <p style={{ color: 'red', marginTop: 10, marginBottom: 0 }}>{error}</p>}
      </div>


    </div>
  );
}; // Keep the closing brace for the component

export default App;