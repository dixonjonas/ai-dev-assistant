import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

//comment all code

//remove google API from project

const SYSTEM_PROMPT = "You are a developer assistant designed to help software engineers quickly answer their technical queries in " +
                            "natural language. Your goal is to provide concise, accurate, and relevant responses for a wide range of " +
                            "programming-related questions, such as explaining code snippets, debugging errors, and suggesting solutions. " +
                            "Keep responses focused and informative. Do not answer any queries unrelated to software development.";

const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash",
  });

  app.post('/api/query', async (req, res) => {
    try {
      const { history, query } = req.body;
  
      // Always start with system prompt
      const messages = [new SystemMessage(SYSTEM_PROMPT)];
  
      // Add chat history if there is any
      if (history && Array.isArray(history)) {
        for (const message of history) {
          if (message.role === 'user') {
            messages.push(new HumanMessage(message.content));
          } else if (message.role === 'assistant') {
            messages.push(new AIMessage(message.content));
          }
        }
      }
  
      // Add the new user query
      messages.push(new HumanMessage(query));

      // Remove this after testing is done
      console.log("Messages being sent to the LLM:", JSON.stringify(messages, null, 2));
  
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const stream = await model.stream(messages);

      for await (const chunk of stream) {
        // Each chunk has a `.content` field
        res.write(chunk.content);
      }

      res.end();
    } catch (error) {
        console.error('Backend streaming error:', error); // Log the error on the server side
    
        // Check if streaming has started. If so, end the response.
        // Otherwise send a standard 500 JSON error response.
        if (res.headersSent) {
          res.end();
        } else {
          res.status(500).json({ error: 'Failed to get a response from the AI.' });
        }
      }
    });
  

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
