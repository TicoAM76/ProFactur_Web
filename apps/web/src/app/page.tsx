import Link from "next/link";
import {
  getDemoCompany,
  getDemoDocument,
  getDemoDocuments,
} from "@/lib/profactur-api";

export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams: Promise<{
    created?: string;
  }>;
}

function formatMoney(value: string, currencyCode = "EUR"): string {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return value;
  }

  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: currencyCode,
  }).format(amount);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default async function Home({ searchParams }: HomePageProps) {
  const query = await searchParams;
  const company = await getDemoCompany();
  const documents = await getDemoDocuments(company.id);
  const recentDocuments = documents.slice(0, 5);
  const latest = recentDocuments[0]
    ? await getDemoDocument(company.id, recentDocuments[0].id)
    : null;

  const totalInvoiced = documents.reduce((total, document) => {
    if (document.id === latest?.id) {
      return total + Number(latest.snapshot.totalAmount);
    }

    return total;
  }, 0);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/">
          <span className="brand-mark">P</span>
          <span>Profactur</span>
        </Link>

        <nav className="navigation" aria-label="Navegación principal">
          <Link className="nav-item active" href="/">
            <span>⌂</span>
            Resumen
          </Link>
          <a className="nav-item" href="#facturas">
            <span>▤</span>
            Facturas
          </a>
          <span className="nav-item muted">
            <span>◎</span>
            Clientes
          </span>
          <span className="nav-item muted">
            <span>◇</span>
            Vehículos
          </span>
          <span className="nav-item muted">
            <span>□</span>
            Catálogo
          </span>
        </nav>

        <div className="sidebar-status">
          <span className="status-dot" />
          <div>
            <strong>Entorno DEMO</strong>
            <small>Sin envío real a AEAT</small>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Panel del negocio</p>
            <h1>{company.tradeName ?? company.legalName}</h1>
          </div>

          <div className="topbar-actions">
            <span className="demo-pill">DEMO</span>
            <Link className="primary-button" href="/facturas/nueva">
              <span>＋</span>
              Nueva factura
            </Link>
          </div>
        </header>

        {query.created ? (
          <div className="success-banner" role="status">
            <span>✓</span>
            <div>
              <strong>Documento creado correctamente</strong>
              <p>{query.created} ya está disponible y tiene QR verificable.</p>
            </div>
          </div>
        ) : null}

        <section className="welcome-card">
          <div>
            <p className="eyebrow">Hoy en tu taller</p>
            <h2>Facturación clara, trazable y preparada para Veri*Factu.</h2>
            <p>
              Gestiona clientes, vehículos y documentos desde un único lugar.
              Este entorno es una simulación y no remite información a la AEAT.
            </p>
          </div>

          <div className="welcome-actions">
            <Link className="primary-button large" href="/facturas/nueva">
              Crear factura DEMO
            </Link>
            {latest ? (
              <a
                className="secondary-button large"
                href={`/api/demo-documents/${latest.id}/pdf`}
              >
                Descargar último PDF
              </a>
            ) : null}
          </div>
        </section>

        <section className="metrics-grid" aria-label="Indicadores">
          <article className="metric-card">
            <span className="metric-icon">€</span>
            <div>
              <p>Última factura</p>
              <strong>
                {latest
                  ? formatMoney(
                      latest.snapshot.totalAmount,
                      latest.currencyCode,
                    )
                  : "0,00 €"}
              </strong>
              <small>IVA incluido</small>
            </div>
          </article>

          <article className="metric-card">
            <span className="metric-icon">▤</span>
            <div>
              <p>Documentos DEMO</p>
              <strong>{documents.length}</strong>
              <small>Todos verificables</small>
            </div>
          </article>

          <article className="metric-card">
            <span className="metric-icon">✓</span>
            <div>
              <p>Estado del sistema</p>
              <strong className="green-text">Operativo</strong>
              <small>API y base de datos activas</small>
            </div>
          </article>

          <article className="metric-card">
            <span className="metric-icon">↗</span>
            <div>
              <p>Envío AEAT</p>
              <strong>Pendiente</strong>
              <small>Certificado y Bridge no configurados</small>
            </div>
          </article>
        </section>

        <section className="content-grid">
          <article className="panel" id="facturas">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Actividad reciente</p>
                <h2>Últimas facturas</h2>
              </div>
              <Link href="/facturas/nueva">Crear nueva</Link>
            </div>

            {recentDocuments.length > 0 ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Número</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                      <th className="right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentDocuments.map((document) => (
                      <tr key={document.id}>
                        <td>
                          <strong>{document.fullNumber}</strong>
                        </td>
                        <td>{formatDate(document.issuedAt)}</td>
                        <td>
                          <span className="status-chip">DEMO verificado</span>
                        </td>
                        <td className="right actions-cell">
                          <a
                            href={`/api/demo-documents/${document.id}/pdf`}
                          >
                            PDF
                          </a>
                          <a
                            href={document.qrUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Verificar
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <strong>Aún no hay documentos.</strong>
                <p>Crea la primera factura DEMO desde este panel.</p>
              </div>
            )}
          </article>

          <aside className="panel system-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Preparación fiscal</p>
                <h2>Estado de integración</h2>
              </div>
            </div>

            <div className="progress-list">
              <div className="progress-item complete">
                <span>✓</span>
                <div>
                  <strong>Cálculo e impuestos</strong>
                  <small>Importes y desglose de IVA</small>
                </div>
              </div>
              <div className="progress-item complete">
                <span>✓</span>
                <div>
                  <strong>XML y hash fiscal</strong>
                  <small>Estructura DEMO generada</small>
                </div>
              </div>
              <div className="progress-item complete">
                <span>✓</span>
                <div>
                  <strong>QR público</strong>
                  <small>Verificación HTTPS operativa</small>
                </div>
              </div>
              <div className="progress-item pending">
                <span>4</span>
                <div>
                  <strong>Profactur Bridge</strong>
                  <small>Instalación local pendiente</small>
                </div>
              </div>
              <div className="progress-item pending">
                <span>5</span>
                <div>
                  <strong>AEAT TEST</strong>
                  <small>Envío real todavía no ejecutado</small>
                </div>
              </div>
            </div>

            <div className="system-note">
              <strong>Importante</strong>
              <p>
                Los documentos de este panel son demostrativos y no tienen
                validez fiscal.
              </p>
            </div>
          </aside>
        </section>

        <footer className="dashboard-footer">
          <span>Profactur DEMO 0.1</span>
          <span>
            {company.city}, {company.province}
          </span>
        </footer>

        <span className="sr-only">
          Importe total de los últimos documentos cargados:{" "}
          {formatMoney(String(totalInvoiced))}
        </span>
      </main>
    </div>
  );
}
