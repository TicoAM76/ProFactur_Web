import { NextResponse } from "next/server";
import { getApiBaseUrl, getDemoCompany } from "@/lib/profactur-api";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{
    documentId: string;
  }>;
}

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  const { documentId } = await context.params;
  const company = await getDemoCompany();

  const response = await fetch(
    `${getApiBaseUrl()}/companies/${company.id}/demo-documents/${documentId}/pdf`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return NextResponse.json(
      {
        error: "No fue posible descargar el PDF solicitado.",
      },
      {
        status: response.status,
      },
    );
  }

  const body = await response.arrayBuffer();

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "application/pdf",
      "Content-Disposition":
        response.headers.get("content-disposition") ??
        `attachment; filename="documento-demo.pdf"`,
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
