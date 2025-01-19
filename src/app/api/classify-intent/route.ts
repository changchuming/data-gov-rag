import { NextResponse } from "next/server";
import { model } from "@/lib/model";
import { IntentType } from "@/types/types";
import { devLog } from "@/lib/logger";

async function classifyIntent(
  messages: { role: string; content: string }[]
): Promise<IntentType> {
  const response = await model.invoke([
    {
      role: "system",
      content:
        "Evaluate the given conversation and determine if retrieving external " +
        "sources of information is necessary to answer the user's query. " +
        "Respond with 'true' if additional information is required to provide " +
        "a complete and accurate answer. Respond with 'false' if the query can " +
        "be sufficiently addressed using the existing context alone. Avoid any " +
        "explanation or elaboration beyond the 'true' or 'false' response.",
    },
    ...messages,
  ]);

  const responseContent =
    typeof response.content === "string" ? response.content : "";
  devLog(`Classify intent response: ${responseContent.toLowerCase()}`);

  return typeof response.content === "string" &&
    response.content.toLowerCase().includes("true")
    ? IntentType.RetrieveFiles
    : IntentType.GeneralQuery;
}

export async function POST(req: Request) {
  const { messages } = await req.json();

  try {
    const intent = await classifyIntent(messages);
    devLog(`Classified intent: ${intent}`);

    return NextResponse.json({
      intent,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request." },
      { status: 500 }
    );
  }
}
