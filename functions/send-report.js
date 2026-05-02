export async function onRequestPost(context) {
  const { request, env } = context;

  const RESEND_KEY = env.RESEND_KEY;
  if (!RESEND_KEY) {
    return json({ ok: false, error: 'RESEND_KEY no configurada en el servidor' }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'JSON inválido' }, 400);
  }

  const { emails, subject, html } = body;
  if (!emails?.length || !html) {
    return json({ ok: false, error: 'Faltan emails o contenido del reporte' }, 400);
  }

  const validEmails = emails.filter(e => typeof e === 'string' && e.includes('@')).slice(0, 20);
  if (!validEmails.length) {
    return json({ ok: false, error: 'Emails inválidos' }, 400);
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + RESEND_KEY
    },
    body: JSON.stringify({
      from: 'WC Sales <reportes@wcsales.com>',
      to: validEmails,
      subject: subject || 'Reporte de Ventas — WC Sales',
      html: html
    })
  });

  const data = await res.json();

  if (!res.ok) {
    return json({ ok: false, error: data?.message || 'Error de Resend' }, 502);
  }

  return json({ ok: true, id: data.id });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
