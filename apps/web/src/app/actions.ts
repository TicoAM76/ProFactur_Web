"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiRequest, getDemoContext } from "@/lib/profactur-api";

interface CreatedDraft {
  id: string;
}

interface CreatedDemoDocument {
  id: string;
  fullNumber: string;
}

interface PresetLine {
  type: "LABOR" | "PRODUCT";
  code: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  taxRate: string;
}

const presets: Record<string, PresetLine[]> = {
  aleta: [
    {
      type: "LABOR",
      code: "CHAPA-H",
      description: "Reparación de aleta delantera",
      quantity: "3",
      unit: "HORA",
      unitPrice: "45",
      taxRate: "21",
    },
    {
      type: "LABOR",
      code: "PINTURA-H",
      description: "Preparación y aplicación de pintura bicapa",
      quantity: "2.5",
      unit: "HORA",
      unitPrice: "50",
      taxRate: "21",
    },
    {
      type: "PRODUCT",
      code: "MAT-PINTURA",
      description: "Pintura, imprimación y barniz",
      quantity: "1",
      unit: "UD",
      unitPrice: "120",
      taxRate: "21",
    },
    {
      type: "PRODUCT",
      code: "CONSUMIBLES",
      description: "Consumibles y materiales auxiliares",
      quantity: "1",
      unit: "UD",
      unitPrice: "35",
      taxRate: "21",
    },
  ],
  parachoques: [
    {
      type: "LABOR",
      code: "CHAPA-H",
      description: "Reparación de parachoques delantero",
      quantity: "2",
      unit: "HORA",
      unitPrice: "45",
      taxRate: "21",
    },
    {
      type: "LABOR",
      code: "PINTURA-H",
      description: "Preparación y pintura de parachoques",
      quantity: "2",
      unit: "HORA",
      unitPrice: "50",
      taxRate: "21",
    },
    {
      type: "PRODUCT",
      code: "MAT-PINTURA",
      description: "Materiales de pintura",
      quantity: "1",
      unit: "UD",
      unitPrice: "120",
      taxRate: "21",
    },
  ],
  mantenimiento: [
    {
      type: "LABOR",
      code: "DIAG-H",
      description: "Diagnosis electrónica y revisión general",
      quantity: "1.5",
      unit: "HORA",
      unitPrice: "45",
      taxRate: "21",
    },
    {
      type: "LABOR",
      code: "MO-HORA",
      description: "Mantenimiento preventivo",
      quantity: "2",
      unit: "HORA",
      unitPrice: "40",
      taxRate: "21",
    },
    {
      type: "PRODUCT",
      code: "CONSUMIBLES",
      description: "Consumibles de mantenimiento",
      quantity: "1",
      unit: "UD",
      unitPrice: "28",
      taxRate: "21",
    },
  ],
};

function safeMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.slice(0, 180);
  }

  return "No fue posible crear la factura DEMO.";
}

export async function createDemoInvoiceAction(
  formData: FormData,
): Promise<void> {
  const preset = String(formData.get("preset") ?? "aleta");
  const notesInput = String(formData.get("notes") ?? "").trim();
  const lines = presets[preset];

  if (!lines) {
    redirect(
      "/facturas/nueva?error=" +
        encodeURIComponent("El tipo de trabajo seleccionado no es válido."),
    );
  }

  const notes =
    notesInput ||
    (preset === "parachoques"
      ? "Reparación y pintura de parachoques delantero."
      : preset === "mantenimiento"
        ? "Mantenimiento preventivo y diagnosis del vehículo."
        : "Reparación de aleta delantera y pintura bicapa.");

  let createdFullNumber: string;

  try {
    const { company, customer, vehicle } = await getDemoContext();

    const draft = await apiRequest<CreatedDraft>(
      `/companies/${company.id}/invoice-drafts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: customer.id,
          vehicleId: vehicle.id,
          currencyCode: "EUR",
          notes,
        }),
      },
    );

    for (const line of lines) {
      await apiRequest(
        `/companies/${company.id}/invoice-drafts/${draft.id}/lines`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(line),
        },
      );
    }

    await apiRequest(
      `/companies/${company.id}/invoice-drafts/${draft.id}/ready`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "{}",
      },
    );

    const document = await apiRequest<CreatedDemoDocument>(
      `/companies/${company.id}/invoice-drafts/${draft.id}/demo-document`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "{}",
      },
    );

    createdFullNumber = document.fullNumber;
  } catch (error: unknown) {
    redirect(
      "/facturas/nueva?error=" + encodeURIComponent(safeMessage(error)),
    );
  }

  revalidatePath("/");
  redirect(`/?created=${encodeURIComponent(createdFullNumber)}`);
}
