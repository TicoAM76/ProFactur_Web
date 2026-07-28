export interface DemoVerificationPageData {
  status: string;
  recognizedByFacturTaller: boolean;
  fullNumber: string;
  issuedAt: Date | string;
  seller: string;
  totalAmount: string;
  currencyCode: string;
  qrLabel: string;
  aeatSubmitted: boolean;
  aeatAccepted: boolean;
  disclaimer: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatAmount(value: string, currencyCode: string): string {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return escapeHtml(value);
  }

  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
}

function formatDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('es-ES', {
    timeZone: 'Europe/Madrid',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function statusRow(
  label: string,
  value: boolean,
  negativeLabel: string,
): string {
  const stateClass = value ? 'ok' : 'neutral';
  const stateText = value ? 'Sí' : negativeLabel;

  return `
    <div class="status-row">
      <span>${escapeHtml(label)}</span>
      <strong class="${stateClass}">${escapeHtml(stateText)}</strong>
    </div>
  `;
}

function brandSymbol(): string {
  return `
    <svg class="brand-symbol" viewBox="0 0 128 128" aria-hidden="true">
      <rect width="128" height="128" rx="26" fill="#0D1B2A"/>
      <path d="M32 20h43l21 21v63H32z" fill="none" stroke="#fff" stroke-width="7" stroke-linejoin="round"/>
      <path d="M75 20v22h21" fill="none" stroke="#fff" stroke-width="7" stroke-linejoin="round"/>
      <path d="M45 56h24M45 70h18M45 84h10" stroke="#fff" stroke-width="7" stroke-linecap="round"/>
      <path d="M78 57v36M66 57h25" stroke="#FF7A00" stroke-width="8" stroke-linecap="round"/>
      <path d="M50 99l24-24" stroke="#FF7A00" stroke-width="9" stroke-linecap="round"/>
      <path d="M43 103a15 15 0 0 1 8-25l9 9-8 8z" fill="#FF7A00"/>
      <circle cx="78" cy="71" r="5" fill="#0D1B2A"/>
    </svg>
  `;
}

export function renderDemoVerificationPage(
  data: DemoVerificationPageData,
): string {
  const seller = escapeHtml(data.seller);
  const fullNumber = escapeHtml(data.fullNumber);
  const qrLabel = escapeHtml(data.qrLabel);
  const disclaimer = escapeHtml(data.disclaimer);
  const totalAmount = escapeHtml(
    formatAmount(data.totalAmount, data.currencyCode),
  );
  const issuedAt = escapeHtml(formatDate(data.issuedAt));

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src 'unsafe-inline'; img-src data:;"
  >
  <meta name="robots" content="noindex,nofollow,noarchive">
  <title>Verificación ${fullNumber} | FacturTaller</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #172033;
      --muted: #667085;
      --line: #d9dee8;
      --panel: #ffffff;
      --background: #f4f7fb;
      --brand: #0d1b2a;
      --orange: #ff7a00;
      --accent: #087f5b;
      --accent-soft: #e9f8f2;
      --warning: #9a6700;
      --warning-soft: #fff7df;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      background:
        radial-gradient(circle at top left, #e6edf7 0, transparent 34rem),
        var(--background);
      color: var(--ink);
      font-family:
        Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
        "Segoe UI", sans-serif;
    }

    main {
      width: min(100% - 32px, 680px);
      margin: 0 auto;
      padding: 28px 0 48px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 13px;
      margin-bottom: 22px;
    }

    .brand-symbol {
      width: 48px;
      height: 48px;
      flex: 0 0 auto;
    }

    .brand-name {
      color: var(--brand);
      font-size: 24px;
      font-weight: 900;
      letter-spacing: -0.04em;
    }

    .brand-name em {
      color: var(--orange);
      font-style: normal;
    }

    .brand-subtitle {
      display: block;
      margin-top: 2px;
      color: var(--muted);
      font-size: 11px;
      font-weight: 650;
    }

    .card {
      overflow: hidden;
      border: 1px solid var(--line);
      border-radius: 22px;
      background: var(--panel);
      box-shadow: 0 22px 60px rgba(23, 32, 51, 0.10);
    }

    .hero {
      padding: 30px;
      border-bottom: 1px solid var(--line);
      background:
        linear-gradient(135deg, var(--accent-soft), #ffffff 72%);
    }

    .verified {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 14px;
      padding: 7px 11px;
      border-radius: 999px;
      background: #fff;
      color: var(--accent);
      font-size: 13px;
      font-weight: 800;
      box-shadow: 0 4px 18px rgba(8, 127, 91, 0.10);
    }

    .check {
      display: grid;
      width: 21px;
      height: 21px;
      place-items: center;
      border-radius: 50%;
      background: var(--accent);
      color: #fff;
      font-size: 13px;
    }

    h1 {
      margin: 0;
      font-size: clamp(28px, 6vw, 42px);
      line-height: 1.06;
      letter-spacing: -0.04em;
    }

    .subtitle {
      margin: 13px 0 0;
      color: var(--muted);
      line-height: 1.55;
    }

    .content { padding: 30px; }

    .number {
      margin-bottom: 22px;
      color: var(--muted);
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .number strong {
      display: block;
      margin-top: 5px;
      color: var(--ink);
      font-size: 23px;
      letter-spacing: -0.02em;
      text-transform: none;
    }

    .facts {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 24px;
    }

    .fact {
      min-width: 0;
      padding: 16px;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: #fbfcfe;
    }

    .fact span {
      display: block;
      margin-bottom: 6px;
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .fact strong {
      display: block;
      overflow-wrap: anywhere;
      font-size: 17px;
    }

    .fact.total strong {
      color: var(--accent);
      font-size: 24px;
    }

    .status-box {
      margin-bottom: 20px;
      overflow: hidden;
      border: 1px solid var(--line);
      border-radius: 14px;
    }

    .status-row {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      padding: 14px 16px;
      border-bottom: 1px solid var(--line);
      font-size: 14px;
    }

    .status-row:last-child { border-bottom: 0; }
    .status-row strong { text-align: right; }
    .ok { color: var(--accent); }
    .neutral { color: var(--muted); }

    .warning {
      padding: 17px;
      border: 1px solid #efd58a;
      border-radius: 14px;
      background: var(--warning-soft);
      color: #6f4c00;
      line-height: 1.5;
    }

    .warning strong {
      display: block;
      margin-bottom: 5px;
      color: var(--warning);
    }

    .qr-label {
      margin-top: 20px;
      color: var(--muted);
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-align: center;
      text-transform: uppercase;
    }

    footer {
      margin-top: 20px;
      color: var(--muted);
      font-size: 12px;
      line-height: 1.5;
      text-align: center;
    }

    @media (max-width: 560px) {
      main {
        width: min(100% - 20px, 680px);
        padding-top: 18px;
      }

      .hero, .content { padding: 22px; }
      .facts { grid-template-columns: 1fr; }

      .status-row {
        align-items: flex-start;
        flex-direction: column;
        gap: 5px;
      }

      .status-row strong { text-align: left; }
    }
  </style>
</head>
<body>
  <main>
    <div class="brand">
      ${brandSymbol()}
      <div>
        <div class="brand-name">Factur<em>Taller</em></div>
        <span class="brand-subtitle">
          Una solución de RN Soluciones Digitales
        </span>
      </div>
    </div>

    <section class="card">
      <header class="hero">
        <div class="verified">
          <span class="check">✓</span>
          Documento reconocido por FacturTaller
        </div>

        <h1>Verificación de documento DEMO</h1>
        <p class="subtitle">
          El código escaneado corresponde a un documento demostrativo
          registrado en el entorno de FacturTaller.
        </p>
      </header>

      <div class="content">
        <div class="number">
          Número del documento
          <strong>${fullNumber}</strong>
        </div>

        <div class="facts">
          <div class="fact">
            <span>Emisor</span>
            <strong>${seller}</strong>
          </div>

          <div class="fact">
            <span>Fecha de emisión</span>
            <strong>${issuedAt}</strong>
          </div>

          <div class="fact total">
            <span>Importe total</span>
            <strong>${totalAmount}</strong>
          </div>

          <div class="fact">
            <span>Modo</span>
            <strong>Demostración</strong>
          </div>
        </div>

        <div class="status-box">
          ${statusRow(
            'Reconocido por FacturTaller',
            data.recognizedByFacturTaller,
            'No',
          )}
          ${statusRow('Enviado a la AEAT', data.aeatSubmitted, 'No enviado')}
          ${statusRow('Aceptado por la AEAT', data.aeatAccepted, 'No aceptado')}
        </div>

        <div class="warning">
          <strong>Documento sin validez fiscal</strong>
          ${disclaimer}
        </div>

        <div class="qr-label">${qrLabel}</div>
      </div>
    </section>

    <footer>
      Verificación interna del entorno DEMO de FacturTaller.<br>
      Esta pantalla no constituye una respuesta ni una validación de la AEAT.
    </footer>
  </main>
</body>
</html>`;
}
