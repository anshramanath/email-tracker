import { CohereClient } from 'cohere-ai'
import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

// Initialize the Cohere API client with your API key
const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
})

export async function summarizeText(emails, prompt) {
  // Format emails into a numbered list for the prompt
  const formatted = emails.map((text, i) => `Email ${i + 1}:\n${text}`).join('\n\n')

  // Construct the prompt that tells the model how to summarize the emails
  const fullPrompt = `
    You are an AI assistant that summarizes unread emails using bullet points and emojis.
    
    Instructions:
    - If the prompt is empty (""), add: ☁️ Prompt Status: No Prompt
    - If **any email contains the prompt keyword (case-insensitive)**, add: 🎯 Prompt Status: Relevant Emails Found
    - If none contain it, add: 🚫 Prompt Status: No Relevant Emails Found
    
    After that, summarize all emails using this format:
    [emoji] [Email title] – Summary
    
    Guidelines:
    - Start each line with a relevant emoji (e.g., 📌, 📨, 💼)
    - Do NOT use extra hyphens or characters before the emoji
    - Return only the final output (status + summaries), no extra commentary
    
    Prompt: "${prompt}"
    
    Unread Emails:
    ${formatted}
  `

  // Generate a response using the Cohere LLM
  const response = await cohere.generate({
    model: 'command-r-plus', // Using a specific LLM model
    prompt: fullPrompt,
    maxTokens: 1000,
    temperature: 0.7, // Controls randomness
  })

  // Extract and clean the output text from the first generation result
  const output = response.generations?.[0]?.text || ''

  console.log(output)

  return output
    .split('\n')             // Split by lines
    .map(line => line.trim()) // Trim whitespace
    .filter(line => line.length > 0) // Filter out empty lines
}