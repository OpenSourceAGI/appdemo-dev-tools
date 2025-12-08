import { ChatGroq } from '@langchain/groq'
import { OpenAIEmbeddings } from '@langchain/openai'

export const chatModel = new ChatGroq({
  model: 'llama-3.3-70b-versatile',
  temperature: 0,
})

export const embeddingModel = new OpenAIEmbeddings({
  model: 'text-embedding-3-small',
})
