import { createClient } from 'npm:@supabase/supabase-js@2';

// MyFatoorah sends the customer's browser here after payment. There is no login on this request, so the function
// proves the payment itself: it asks MyFatoorah (with the secret key) whether the invoice is really paid, and checks
// the result against the pending payment saved at checkout (same person, same plan, same amount).
// The subscription is activated only if everything matches. Replays do nothing.

const clean = (v: string | undefined) => (v ?? '').trim().replace(/^["']+|["']+$/g, '').trim();
// TEMPORARY testing aid, sandbox address only (see create-checkout). Remove once your own key works.
const PUBLIC_TEST_TOKEN = 'SK_KWT_vVZlnnAqu8jRByOWaRPNId4ShzEDNt256dvnjebuyzo52dXjAfRx2ixW5umjWSUx';

Deno.serve(async (req) => {
  const site = clean(Deno.env.get('SITE_URL')).replace(/\/+$/, '');
  const back = () => new Response(null, { status: 302, headers: { Location: `${site}/#/` } });
  try {
    const apiKey = clean(Deno.env.get('MYFATOORAH_API_KEY'));
    const paymentId = new URL(req.url).searchParams.get('paymentId');
    if (!site) return new Response('SITE_URL is not set for this function.', { status: 500 });
    if (!apiKey || !paymentId) return back();
    const base = (clean(Deno.env.get('MYFATOORAH_BASE_URL')) || 'https://apitest.myfatoorah.com').replace(/\/+$/, '');

    const keys = [apiKey];
    if (base.includes('apitest.')) keys.push(PUBLIC_TEST_TOKEN);
    let d: any = null;
    for (const k of keys) {
      const res = await fetch(`${base}/v2/GetPaymentStatus`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${k}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ Key: paymentId, KeyType: 'PaymentId' }),
      });
      const raw = await res.text();
      let out: any = null;
      try { out = raw ? JSON.parse(raw) : null; } catch (_) { out = null; }
      if (out?.IsSuccess && out.Data) { d = out.Data; break; }
      if (res.status !== 401) break;
    }
    if (!d || d.InvoiceStatus !== 'Paid') return back();

    // The checkout stored the person's id as the customer reference; the plan comes from our own saved checkout.
    const userId = String(d.CustomerReference || '');
    const invoiceId = String(d.InvoiceId);
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: pay } = await admin.from('payments').select('user_id,plan_code,amount')
      .eq('provider', 'myfatoorah').eq('provider_ref', invoiceId).maybeSingle();
    if (!pay || pay.user_id !== userId || Math.abs(Number(d.InvoiceValue) - Number(pay.amount)) > 0.0005) {
      console.error('Payment did not match the saved checkout', invoiceId);
      return back();
    }
    const { error } = await admin.rpc('activate_subscription', {
      p_user: userId, p_plan: pay.plan_code, p_provider: 'myfatoorah', p_ref: invoiceId,
    });
    if (error) console.error(error.message);
  } catch (e) {
    console.error(String(e));
  }
  return back();
});
