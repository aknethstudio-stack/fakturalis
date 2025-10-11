import type { NextRequest } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  const body = await req.json();
  // Dane raportu przekazane z dashboardu
  const { mrr, churn, clv, cashflow, clientSegments, topProducts, periodComparisons } = body;

  // Generowanie treści e-maila (można rozbudować o załącznik PDF/CSV/XLSX)
  const mailText = `
Raport analityczny Fakturalis

MRR: ${mrr}
Churn: ${churn}
CLV: ${clv}
Cashflow: ${JSON.stringify(cashflow)}
Segmentacja: ${JSON.stringify(clientSegments)}
Top produkty: ${JSON.stringify(topProducts)}
Porównania okresowe: ${JSON.stringify(periodComparisons)}
`;

  // Dane SMTP (do konfiguracji w .env.local, np. Gmail, WP, Proton, Sendinblue Free)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Pobierz e-mail zalogowanego użytkownika (w produkcji: z sesji/auth)
  const userEmail = req.headers.get('x-user-email');
  if (!userEmail) {
    return new Response('Brak adresu e-mail użytkownika', { status: 400 });
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: userEmail,
      subject: 'Raport analityczny Fakturalis',
      text: mailText,
      // attachments: [{ filename: 'raport.pdf', content: ... }],
    });
    return new Response('OK', { status: 200 });
  } catch (err) {
    return new Response('Błąd wysyłki: ' + String(err), { status: 500 });
  }
}
