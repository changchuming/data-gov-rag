import { NextResponse } from "next/server";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { model, embeddings } from "@/lib/model";
import { supabase } from "@/lib/supabase";
import { DocType } from "@/types/types";
import { devLog } from "@/lib/logger";

async function isDocumentRelevant(
    document: string,
    query: string
  ): Promise<boolean> {
    const response = await model.invoke([
      {
        role: "system",
        content:
          "You are a document relevance evaluator. Your task is to analyze " +
          "the title and description of a document to determine if the full document " +
          "could help answer the user's query. You will not see the full document contents. " +
          "Consider both direct relevance (explicit mentions) and indirect relevance " +
          "(related concepts or context suggested by the title/description). " +
          "Respond with 'true' or 'false' followed by a brief explanation of your reasoning. " +
          "Mark as 'true' if the document's title and description suggest it contains " +
          "information that could contribute to answering the query. " +
          "Be inclusive rather than exclusive - if the title/description hints at potential value, " +
          "mark it as relevant. Format your response as: true/false: <explanation>",
      },
      {
        role: "user",
        content: `DOCUMENT TO EVALUATE:\n${document}\n\nUSER QUERY:\n${query}\n\nRESPOND WITH EXACTLY 'true' or 'false':`,
      },
    ]);

    return (
      typeof response.content === "string" &&
      response.content.toLowerCase().includes("true")
    );
  }

export async function POST(req: Request) {
  const { latestMessage } = await req.json();

  try {
    const vectorStore = await SupabaseVectorStore.fromExistingIndex(
      embeddings,
      {
        client: supabase,
        tableName: "documents",
        queryName: "match_documents",
      }
    );

    const similarDocs : DocType[] = await vectorStore.similaritySearch(latestMessage, 3);

    devLog("Similar documents count:", similarDocs.length);
    similarDocs.forEach(doc => devLog("Similar content:", doc.pageContent));

    const relevantDocs = await Promise.all(
      similarDocs.map(async (doc) => {
        if (await isDocumentRelevant(doc.pageContent, latestMessage)) {
          return doc;
        }
        return null;
      })
    );

    const filteredDocs = relevantDocs.filter(Boolean);
    devLog("Relevant documents count:", filteredDocs.length);
    filteredDocs.forEach((doc) => {
      if (doc) {
        devLog("Relevant content:", doc.pageContent);
      }
    });

    return NextResponse.json({ relevantDocs: filteredDocs });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "An error occurred while retrieving documents." },
      { status: 500 }
    );
  }
}