const API_BASE_URL =
  process.env.PROFACTUR_API_INTERNAL_URL ?? "http://127.0.0.1:3001";

const DEMO_COMPANY_TAX_ID =
  process.env.PROFACTUR_DEMO_COMPANY_TAX_ID ?? "B00000000";

export interface Company {
  id: string;
  legalName: string;
  tradeName: string | null;
  taxId: string;
  city: string;
  province: string;
}

export interface Customer {
  id: string;
  legalName: string;
  taxId: string | null;
}

export interface Vehicle {
  id: string;
  registrationNumber: string;
  brand: string;
  model: string;
  version: string | null;
}

export interface DemoDocumentListItem {
  id: string;
  companyId: string;
  sourceDraftId: string;
  fullNumber: string;
  issuedAt: string;
  currencyCode: string;
  qrUrl: string;
  fiscalHash: string;
  xmlHash: string;
  pdfHash: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DemoDocumentSnapshot {
  customerLegalName: string;
  vehicleRegistrationNumber: string | null;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  notes: string | null;
}

export interface DemoDocumentDetail extends DemoDocumentListItem {
  snapshot: DemoDocumentSnapshot;
}

type ApiOptions = RequestInit & {
  expectedStatus?: number;
};

export async function apiRequest<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { expectedStatus, ...requestInit } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestInit,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...requestInit.headers,
    },
  });

  if (
    !response.ok ||
    (expectedStatus !== undefined && response.status !== expectedStatus)
  ) {
    const body = await response.text();

    throw new Error(
      `Profactur API ${response.status}: ${body || response.statusText}`,
    );
  }

  return (await response.json()) as T;
}

export async function getDemoCompany(): Promise<Company> {
  const companies = await apiRequest<Company[]>("/companies");
  const company = companies.find(
    (candidate) => candidate.taxId === DEMO_COMPANY_TAX_ID,
  );

  if (!company) {
    throw new Error(
      `No existe la empresa DEMO con NIF ${DEMO_COMPANY_TAX_ID}.`,
    );
  }

  return company;
}

export async function getDemoContext(): Promise<{
  company: Company;
  customer: Customer;
  vehicle: Vehicle;
}> {
  const company = await getDemoCompany();

  const customers = await apiRequest<Customer[]>(
    `/companies/${company.id}/customers`,
  );
  const customer =
    customers.find((candidate) => candidate.taxId === "00000000T") ??
    customers[0];

  if (!customer) {
    throw new Error("La empresa DEMO no tiene clientes.");
  }

  const vehicles = await apiRequest<Vehicle[]>(
    `/companies/${company.id}/customers/${customer.id}/vehicles`,
  );
  const vehicle =
    vehicles.find(
      (candidate) => candidate.registrationNumber === "1234DEM",
    ) ?? vehicles[0];

  if (!vehicle) {
    throw new Error("El cliente DEMO no tiene vehículos.");
  }

  return {
    company,
    customer,
    vehicle,
  };
}

export async function getDemoDocuments(
  companyId: string,
): Promise<DemoDocumentListItem[]> {
  return apiRequest<DemoDocumentListItem[]>(
    `/companies/${companyId}/demo-documents`,
  );
}

export async function getDemoDocument(
  companyId: string,
  documentId: string,
): Promise<DemoDocumentDetail> {
  return apiRequest<DemoDocumentDetail>(
    `/companies/${companyId}/demo-documents/${documentId}`,
  );
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}
