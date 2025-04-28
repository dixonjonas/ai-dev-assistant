import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";

// Load environment variables from a .env file (for our LLM API)
dotenv.config();

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Define the port to run the server on
const PORT = process.env.PORT || 3001;

//remove google API from project

// Define the system prompt for the LLM
const SYSTEM_PROMPT = "You are a developer assistant designed to help software engineers quickly answer their technical queries in " +
                            "natural language. Your goal is to provide concise, accurate, and relevant responses for a wide range of " +
                            "programming-related questions, such as explaining code snippets, debugging errors, and suggesting solutions. " +
                            "Keep responses focused and informative. Do not answer any queries unrelated to software development.";

// Initialize the LLM instance using Google's Gemini
const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash",
  });

  // Define the API endpoint
  app.post('/api/query', async (req, res) => {
    try {
      // Extract the chat history and user query from the request body
      const { history, query } = req.body;
  
      // Append the system prompt to the LLM prompt
      const messages = [new SystemMessage(SYSTEM_PROMPT)];
  
      // Append chat history to the LLM prompt
      if (history && Array.isArray(history)) {
        for (const message of history) {
          if (message.role === 'user') {
            messages.push(new HumanMessage(message.content));
          } else if (message.role === 'assistant') {
            messages.push(new AIMessage(message.content));
          }
        }
      }
  
      // Append the current user prompt to the LLM prompt
      messages.push(new HumanMessage(query));
  
      // Set headers for Server-Sent Events to enable streaming the LLM output
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Inference the LLM in streaming-mode
      const stream = await model.stream(messages);

      // Iterate through the streaming chunks and write each one to the response
      for await (const chunk of stream) {
        res.write(chunk.content);
      }

      // End the response
      res.end();

      // Error handling
    } catch (error) {
      // Log the error on the server side
      console.error('Backend streaming error:', error); 
    
      // Check if streaming has started. If so, end the response.
      // Otherwise send a standard 500 JSON error response.
      if (res.headersSent) {
        res.end();
      } else {
        res.status(500).json({ error: 'Failed to get a response from the AI.' });
      }
    }
  });
  
// Start the HTTP server and have it listen on the defined port
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
