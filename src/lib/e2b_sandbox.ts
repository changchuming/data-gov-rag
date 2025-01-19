import { Sandbox } from "@e2b/code-interpreter";

export async function createE2bSandbox() {
  try {
    const sandbox = await Sandbox.create({ apiKey: process.env.E2B_API_KEY });
    return sandbox;
  } catch (error) {
    console.error("Error creating sandbox:", error);
    throw error;
  }
}