import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Define an initial output to be placed for example "Hello I am a developer assistant ..."

// Add history 

// Maybe implement a topic-check, look at the movie recommendation project.

//comment all code

const SYSTEM_PROMPT = `You are a developer assistant designed to help software engineers quickly answer their technical queries in 
                            natural language. Your goal is to provide concise, accurate, and relevant responses for a wide range of 
                            programming-related questions, such as explaining code snippets, debugging errors, and suggesting solutions. 
                            Keep responses focused and informative. Do not answer any queries unrelated to software development.`;

const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash",
  });

app.post('/api/query', async (req, res) => {
  try {
    const { query } = req.body;
    const response = await model.invoke([
        new SystemMessage(SYSTEM_PROMPT),
        new HumanMessage(query),
    ]);
    res.json({ response: response.text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
