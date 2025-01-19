import { DocumentInterface } from "@langchain/core/documents";

export interface File {
  id: string;
  name: string;
  metadata: Record<string, string>;
  fullContent: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DocType = DocumentInterface<Record<string, any>>;

export enum IntentType {
  RetrieveFiles = "retrieve_files",
  GeneralQuery = "general_query",
}
