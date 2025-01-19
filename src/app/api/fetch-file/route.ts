import { NextResponse } from "next/server";
import { DocType, File } from "@/types/types";
import { devLog } from "@/lib/logger";

export async function POST(req: Request) {
  const { filesToFetch, existingFiles } = await req.json();

  try {
    const newFiles = await Promise.all(
      filesToFetch.map(async (doc: DocType) => {
        const url = `https://data.gov.sg/api/action/datastore_search?resource_id=${doc.metadata.datasetId}`;
        devLog("Fetching URL:", url);

        const response = await fetch(url);
        const fullContent = await response.text();

        return {
          id: doc.metadata.datasetId,
          name: doc.metadata.name,
          metadata: doc.metadata,
          fullContent: fullContent,
        };
      })
    );
    const allFiles: File[] = [...existingFiles, ...newFiles];

    return NextResponse.json({ allFiles });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching files." },
      { status: 500 }
    );
  }
}
