import { NextResponse } from "next/server";
import { model } from "@/lib/model";
import { File } from "@/types/types";

export async function POST(req: Request) {
  const { messages, allFiles } = await req.json();

  try {
    const context = allFiles
      .map((file: File) => {
        return Object.entries(file)
          .map(([key, value]) => `${key}: ${value}`)
          .join("\n");
      })
      .join("\n\n");

    const systemMessage = {
      role: "system",
      content: `
        Here are some retrieved files that are relevant to the user's query:
        ${context}

        When answering:
        - Answer the user's question directly and comprehensively.
        - Do not suggest steps for the user to take or tell them how to find the answer.
        - Cite the relevant file name and line number in parentheses.
        - Provide specific details from the context when applicable.
        - If multiple files are relevant, reference them separately.
        - Ensure your response is complete and doesn't require further action from the user.
      `,
    };

    const response = await model.invoke([systemMessage, ...messages]);

    return NextResponse.json({
      message: response.content,
      files: allFiles,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "An error occurred while generating the response." },
      { status: 500 }
    );
  }
}