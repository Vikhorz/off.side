import { handlers } from "@/lib/auth";
import { NextResponse } from "next/server";

// Add error handling wrapper for route handlers
const wrapHandler = (handler: any) => {
  return async (req: any) => {
    try {
      return await handler(req);
    } catch (error) {
      console.error('API /auth/[...nextauth]: error occurred', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
};

// Wrap the handlers with error handling and export
const { GET: GETHandler, POST: POSTHandler } = handlers;
export const GET = wrapHandler(GETHandler);
export const POST = wrapHandler(POSTHandler);
