import { handleMobileRequest } from "@/lib/mobile/api";

export const runtime = "nodejs";

async function handle(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return handleMobileRequest(request, path);
}

export { handle as GET, handle as POST };
