import { renderDemoVerificationPage } from './demo-verification-page';

describe('demo verification page', () => {
  it('genera una página HTML segura y legible', () => {
    const html = renderDemoVerificationPage({
      status: 'DEMO',
      recognizedByProfactur: true,
      fullNumber: 'DEMO-2026-000003',
      issuedAt: new Date('2026-07-27T12:00:00.000Z'),
      seller: '<script>alert("x")</script>',
      totalAmount: '502.15',
      currencyCode: 'EUR',
      qrLabel: 'QR DEMO — NO AEAT',
      aeatSubmitted: false,
      aeatAccepted: false,
      disclaimer:
        'Documento de demostración sin validez fiscal. No remitido a la Agencia Tributaria.',
    });

    expect(html).toContain('<!doctype html>');
    expect(html).toContain('DEMO-2026-000003');
    expect(html).toContain('502,15');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>alert');
    expect(html).toContain('Documento sin validez fiscal');
  });
});
