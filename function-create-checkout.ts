import { createClient } from 'npm:@supabase/supabase-js@2';

// Starts a MyFatoorah payment for the signed-in student (monthly plan) or employer (yearly plan).
// The price always comes from the plans table, never from the browser.

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const PLAN_FOR_ROLE: Record<string, string> = { student: 'student_monthly', employer: 'employer_yearly' };
// Secrets are often pasted with stray spaces, line breaks or quotation marks. Clean them.
const clean = (v: string | undefined) => (v ?? '').trim().replace(/^["']+|["']+$/g, '').trim();
const fingerprint = async (s: string) => {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d)).slice(0, 4).map((b) => b.toString(16).padStart(2, '0')).join('');
};
// TEMPORARY testing aid: MyFatoorah's public sandbox token (published in their documentation).
// It is tried only on the sandbox address (apitest), after the saved key is rejected. Remove once your own key works.
const PUBLIC_TEST_TOKEN = 'SK_KWT_vVZlnnAqu8jRByOWaRPNId4ShzEDNt256dvnjebuyzo52dXjAfRx2ixW5umjWSUx';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const apiKey = clean(Deno.env.get('MYFATOORAH_API_KEY'));
    if (!apiKey) {
      const similar = Object.keys(Deno.env.toObject()).filter((k) => /myf|fatoorah|site_url/i.test(k));
      console.error(`create-checkout: MYFATOORAH_API_KEY is missing. Similar secret names seen: ${JSON.stringify(similar)}`);
      return json({ error: 'Payment is not set up yet.' }, 503);
    }
    const base = (clean(Deno.env.get('MYFATOORAH_BASE_URL')) || 'https://apitest.myfatoorah.com').replace(/\/+$/, '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return json({ error: 'Please log in first.' }, 401);

    const { data: p } = await admin.from('profiles').select('role,status,full_name,email').eq('id', user.id).single();
    if (!p || p.status !== 'active') return json({ error: 'Your account is not active yet.' }, 403);
    const planCode = PLAN_FOR_ROLE[p.role];
    if (!planCode) return json({ error: 'Your account type does not have a paid plan.' }, 403);
    const { data: plan } = await admin.from('plans').select('code,amount,currency').eq('code', planCode).single();
    if (!plan) return json({ error: 'Plan not found.' }, 500);

    const callback = `${supabaseUrl}/functions/v1/payment-callback`;
    const body = JSON.stringify({
      NotificationOption: 'LNK',
      InvoiceValue: Number(plan.amount),
      DisplayCurrencyIso: plan.currency,
      CustomerName: p.full_name || 'Shababna user',
      CustomerEmail: p.email,
      CallBackUrl: callback,
      ErrorUrl: callback,
      Language: 'en',
      CustomerReference: user.id, // 36 characters; MyFatoorah allows at most 50
      UserDefinedField: planCode,
    });

    const keys = [apiKey];
    if (base.includes('apitest.')) keys.push(PUBLIC_TEST_TOKEN);
    let out: any = null;
    for (let i = 0; i < keys.length; i++) {
      const res = await fetch(`${base}/v2/SendPayment`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${keys[i]}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body,
      });
      const raw = await res.text();
      let o: any = null;
      try { o = raw ? JSON.parse(raw) : null; } catch (_) { o = null; }
      if (o?.IsSuccess && o.Data?.InvoiceURL) {
        console.log(`Payment page created using ${i === 0 ? 'the saved key' : 'the public sandbox token'}`);
        out = o;
        break;
      }
      console.error('MyFatoorah SendPayment failed', JSON.stringify({
        http: res.status, base, which: i === 0 ? 'saved key' : 'public sandbox token', keyLength: keys[i].length,
        keyFingerprint: await fingerprint(keys[i]), message: o?.Message, errors: o?.ValidationErrors, bodyStart: raw.slice(0, 200),
      }));
      if (res.status !== 401) break;
    }
    if (!out) return json({ error: 'The payment page could not be created. Please try again.' }, 502);

    const { error } = await admin.from('payments').insert({
      user_id: user.id, plan_code: planCode, amount: plan.amount, currency: plan.currency,
      provider: 'myfatoorah', provider_ref: String(out.Data.InvoiceId), status: 'pending',
    });
    if (error) { console.error(error.message); return json({ error: 'Could not start the payment.' }, 500); }
    return json({ url: out.Data.InvoiceURL });
  } catch (e) {
    console.error(String(e));
    return json({ error: 'Something went wrong.' }, 500);
  }
});
