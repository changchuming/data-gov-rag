"use client";

import { useState } from "react";
import { DocType, File, IntentType } from "@/types/types";

export default function Home() {
  const [inputState, setInputState] = useState<{value: string, disabled: boolean}>({
    value: "",
    disabled: false
  });
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    []
  );
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const updateUIState = (
    newMessages: { role: string; content: string }[],
    disabled: boolean
  ) => {
    setMessages(newMessages);
    setInputState({
      value: disabled ? "Thinking..." : "",
      disabled
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputState.value.trim() || inputState.disabled) return;

    const userInput = inputState.value;
    const newMessages = [...messages, { role: "user", content: userInput }];
    updateUIState(newMessages, true);

    try {
      // Classify intent
      const classifyResponse = await fetch("/api/classify-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      if (!classifyResponse.ok) throw new Error("Failed to classify intent");
      const { intent } = await classifyResponse.json();

      if (intent === IntentType.RetrieveFiles) {
        // Retrieve relevant documents
        const retrieveResponse = await fetch("/api/retrieve-documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latestMessage: userInput }),
        });
        if (!retrieveResponse.ok)
          throw new Error("Failed to retrieve documents");
        const { relevantDocs } = await retrieveResponse.json();

        // Fetch new files if necessary
        const filesToFetch = relevantDocs.filter(
          (doc: DocType) =>
            !files.some((file) => file.id === doc.metadata.datasetId)
        );
        if (filesToFetch.length > 0) {
          const fetchResponse = await fetch("/api/fetch-file", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filesToFetch, existingFiles: files }),
          });
          if (!fetchResponse.ok) throw new Error("Failed to fetch files");
          const { allFiles } = await fetchResponse.json();
          setFiles(allFiles);
        }
      }

      // Generate response
      const generateResponse = await fetch("/api/generate-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, allFiles: files }),
      });
      if (!generateResponse.ok) throw new Error("Failed to generate response");
      const { message } = await generateResponse.json();
      newMessages.push({ role: "assistant", content: message });


    // Execute code interpretation
    const interpretResponse = await fetch("/api/interpret-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: userInput }),
    });
    if (!interpretResponse.ok) throw new Error("Failed to interpret code");
    const { output, logs, outputFiles } = await interpretResponse.json();
    const executionResult = `Code execution output:\n${output}\n\nExecution logs:\n${logs.join("\n")}`;
    newMessages.push({ role: "assistant", content: executionResult });

    } catch (error) {
      console.error("Error:", error);
      newMessages.push({
        role: "assistant",
        content: "An error occurred while processing your request."
      });
    } finally {
      updateUIState(newMessages, false);
    }
  };

  const handleFileClick = (file: File) => {
    setSelectedFile(file);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-7xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8">Explore data.gov.sg</h1>
        <div className="flex">
          <div className="w-1/4 bg-gray-100 p-4 rounded-lg shadow mr-4">
            <h2 className="text-xl font-bold mb-4">Retrieved Files</h2>
            <ul>
              {files.map((file) => (
                <li
                  key={file.id}
                  className="cursor-pointer hover:bg-gray-200 p-2 rounded"
                  onClick={() => handleFileClick(file)}
                >
                  {file.name}
                </li>
              ))}
            </ul>
          </div>
          <div className="w-3/4 bg-white p-4 rounded-lg shadow">
            <div className="mb-4 h-80 overflow-y-auto">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-2 ${
                    msg.role === "user" ? "text-right" : "text-left"
                  }`}
                >
                  <span
                    className={`inline-block p-2 rounded-lg ${
                      msg.role === "user" ? "bg-blue-100" : "bg-gray-100"
                    }`}
                  >
                    {msg.content}
                  </span>
                </div>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="flex">
              <input
                type="text"
                value={inputState.disabled ? "Thinking..." : inputState.value}
                onChange={(e) => setInputState({...inputState, value: e.target.value})}
                className="flex-grow mr-2 p-2 border rounded"
                placeholder="Type your message..."
                disabled={inputState.disabled}
                readOnly={inputState.disabled}
              />
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded"
                disabled={inputState.disabled}
              >
                Send
              </button>
            </form>
          </div>
        </div>
        {selectedFile && (
          <div className="mt-4 bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-2">{selectedFile.name}</h3>
            <div className="mb-4">
              <pre className="whitespace-pre-wrap bg-gray-100 p-2 rounded">
                {Object.entries(selectedFile.metadata).map(([key, value]) => (
                  <div key={key}>
                    <strong>{key}:</strong> {value}
                  </div>
                ))}
              </pre>
            </div>
            <div>
              <h4 className="text-md font-semibold mb-2">Full Content:</h4>
              <pre className="whitespace-pre-wrap bg-gray-100 p-2 rounded max-h-96 overflow-y-auto">
                {typeof selectedFile.fullContent === "string"
                  ? selectedFile.fullContent
                  : JSON.stringify(selectedFile.fullContent, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
