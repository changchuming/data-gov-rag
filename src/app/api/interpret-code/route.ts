import { NextResponse } from "next/server";
import { Sandbox } from "@e2b/code-interpreter";
import { createE2bSandbox } from "@/lib/e2b_sandbox";
import { devLog } from "@/lib/logger";

export async function POST(req: Request) {
    let sbx: Sandbox | null = null;
    try {
      sbx = await createE2bSandbox();
      const execution = await sbx.runCode('print("hello world")');
      devLog("Code execution output:", execution.text);
      devLog("Code execution logs:", execution.logs);

      const files = await sbx.files.list("/");
      devLog("Files in sandbox root directory:", files);

      return NextResponse.json({
        output: execution.text,
        logs: execution.logs,
        files: files
      });
    } finally {
      if (sbx) {
        await sbx.kill();
      }
    }
}
