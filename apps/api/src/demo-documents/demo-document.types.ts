export interface DemoDocumentSnapshotLine {
  position: number;
  code: string | null;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  discountRate: string;
  taxRate: string;
  netAmount: string;
  taxAmount: string;
  totalAmount: string;
}

export interface DemoDocumentSnapshot {
  fullNumber: string;
  issuedAt: string;
  currencyCode: string;
  notes: string | null;

  sellerLegalName: string;
  sellerTradeName: string | null;
  sellerTaxId: string;
  sellerAddressLine1: string;
  sellerAddressLine2: string | null;
  sellerPostalCode: string;
  sellerCity: string;
  sellerProvince: string;
  sellerCountryCode: string;
  sellerPhone: string | null;
  sellerEmail: string | null;
  sellerWebsite: string | null;

  customerLegalName: string;
  customerTradeName: string | null;
  customerTaxId: string;
  customerAddressLine1: string | null;
  customerAddressLine2: string | null;
  customerPostalCode: string | null;
  customerCity: string | null;
  customerProvince: string | null;
  customerCountryCode: string;
  customerPhone: string | null;
  customerEmail: string | null;

  vehicleRegistrationNumber: string | null;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  vehicleVersion: string | null;
  vehicleVin: string | null;
  vehicleMileage: number | null;

  subtotal: string;
  taxAmount: string;
  totalAmount: string;

  lines: DemoDocumentSnapshotLine[];
}

export interface DemoDocumentReadiness {
  mode: 'DEMO';
  invoiceDataComplete: true;
  taxCalculationValid: true;
  xmlGenerated: true;
  xsdStructureValidated: true;
  xsdValidationScope: string;
  fiscalHashGenerated: true;
  qrMode: 'DEMO_NO_AEAT';
  certificateConfigured: false;
  bridgeConfigured: false;
  aeatSubmitted: false;
  aeatAccepted: false;
  remainingSteps: string[];
}
