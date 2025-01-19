import { ChatOpenAI } from "@langchain/openai";
import { OpenAIEmbeddings } from "@langchain/openai";

// Anthropic model
// const anthropicApiKey = process.env.ANTHROPIC_API_KEY!;
// export const model = new ChatAnthropic({ anthropicApiKey, modelName: "claude-3-5-sonnet-20240620" });

// OpenAI model
const openAIApiKey = process.env.OPENAI_API_KEY!;
export const model = new ChatOpenAI({ openAIApiKey });

// OpenAI embeddings
export const embeddings = new OpenAIEmbeddings({ openAIApiKey });