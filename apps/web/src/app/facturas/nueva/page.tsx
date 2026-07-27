import Link from "next/link";
import { createDemoInvoiceAction } from "@/app/actions";
import { getDemoContext } from "@/lib/profactur-api";

export const dynamic = "force-dynamic";

interface NewInvoicePageProps {
  searchParams: Promise<{
    error?: string;
  }>;
}

export default async function NewInvoicePage({
  searchParams,
}: NewInvoicePageProps) {
  const query = await searchParams;
  const { company, customer, vehicle } = await getDemoContext();

  return (
    <main className="form-page">
      <div className="form-page-header">
        <Link className="back-link" href="/">
          ← Volver al panel
        </Link>
        <span className="demo-pill">ENTORNO DEMO</span>
      </div>

      <section className="form-card">
        <div className="form-intro">
          <p className="eyebrow">Nueva factura</p>
          <h1>Crear documento demostrativo</h1>
          <p>
            El sistema creará un borrador, calculará el IVA, generará el XML,
            reservará un número DEMO y producirá un PDF con QR verificable.
          </p>
        </div>

        {query.error ? (
          <div className="error-banner" role="alert">
            <strong>No se pudo crear el documento</strong>
            <p>{query.error}</p>
          </div>
        ) : null}

        <div className="context-grid">
          <div>
            <span>Empresa</span>
            <strong>{company.tradeName ?? company.legalName}</strong>
          </div>
          <div>
            <span>Cliente</span>
            <strong>{customer.legalName}</strong>
          </div>
          <div>
            <span>Vehículo</span>
            <strong>
              {vehicle.brand} {vehicle.model} · {vehicle.registrationNumber}
            </strong>
          </div>
        </div>

        <form action={createDemoInvoiceAction} className="invoice-form">
          <label>
            <span>Tipo de trabajo</span>
            <select name="preset" defaultValue="aleta">
              <option value="aleta">
                Reparación de aleta y pintura bicapa
              </option>
              <option value="parachoques">
                Reparación y pintura de parachoques
              </option>
              <option value="mantenimiento">
                Diagnosis y mantenimiento preventivo
              </option>
            </select>
          </label>

          <label>
            <span>Observaciones</span>
            <textarea
              name="notes"
              rows={4}
              maxLength={500}
              placeholder="Descripción del trabajo realizado..."
            />
            <small>
              Si se deja vacío, Profactur utilizará una descripción
              profesional acorde al trabajo seleccionado.
            </small>
          </label>

          <div className="demo-warning">
            <strong>Simulación controlada</strong>
            <p>
              Se generará un documento DEMO sin validez fiscal y no se enviará
              a la Agencia Tributaria.
            </p>
          </div>

          <div className="form-actions">
            <Link className="secondary-button large" href="/">
              Cancelar
            </Link>
            <button className="primary-button large" type="submit">
              Crear factura DEMO
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
