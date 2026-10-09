import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.58.0/+esm';
import { SUPABASE_URL, SUPABASE_KEY, CONTACT_EMAIL, LEGAL_DRAFT } from './config.js';
const TERMS_VERSION = '2026-10';
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const SELF = ['student', 'parent', 'employer', 'merchant'];           // admin can never sign up here
const HOME = { student: '#/student', parent: '#/parent', employer: '#/employer', merchant: '#/merchant', admin: '#/admin' };
const go = (h) => { if (location.hash !== h) location.hash = h; else route(); };
let tt; const toast = (m) => { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(tt); tt = setTimeout(() => (t.hidden = true), 3500); };
const fail = (e) => toast(e?.message || 'Something went wrong');
const isDark = () => (document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light')) === 'dark';
const themeBtn = (cls) => `<button class="${cls}" data-act="theme" aria-label="Switch to ${isDark() ? 'light' : 'dark'} mode">${isDark() ? 'Light mode' : 'Dark mode'}</button>`;
const flipTheme = () => { const n = isDark() ? 'light' : 'dark'; document.documentElement.dataset.theme = n; try { localStorage.setItem('sh-theme', n); } catch (_) {} };
const view = (a, html) => { $('#app').innerHTML = `<header><b class="logo">shababna</b><span class="sp"></span>${themeBtn('ghost')}${a ? `<a class="ghost" href="#/profile">Profile</a><span class="tag">${esc(a.role)}</span><span class="who">${esc(a.name || '')}</span><button class="ghost" data-act="out">Sign out</button>` : ''}</header><main>${html}</main><footer class="ft"><a href="#/terms">Terms and Conditions</a> · <a href="#/privacy">Privacy Policy</a></footer>`; };

// Role and status always come from the database, never from the URL or local state.
async function access() {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { state: 'anon' };
  const { data, error } = await sb.from('profiles').select('role,status,full_name').eq('id', user.id).single();
  if (error || !data) return { state: 'norole' };
  return { state: data.status === 'active' ? 'ok' : data.status, role: data.role, name: data.full_name, id: user.id };
}

const LEGAL = {
  privacy: ['Privacy Policy', [
    ['Who we are', 'Shababna is a platform that connects young people in Kuwait, aged 14 to 22, with camps, volunteering and internships. This policy explains what information we collect, why we use it and who can see it.'],
    ['Information we collect', ['Account details: your name, email address, phone number and password (stored in protected form).', 'Identity details: photos of your Civil ID and your date of birth, used to confirm who you are and your age.', 'Parent details: for students under 18, the parent account that approves their activities.', 'Activity details: applications and your answers, hours, performance scores, certificates and reward coupon codes.', 'Subscription and payment records: plan, amount, date and status. Card details are handled by our payment provider and are not stored by us.']],
    ['Why we use it', ['To verify identity and age and to keep young people safe.', 'To get a parent approval before a student under 18 joins an activity.', 'To run the platform: applications, hours, certificates and rewards.', 'To take payment for subscriptions.', 'To help you, to prevent misuse, and to meet legal duties.']],
    ['Young people and parents', 'Students under 18 need a linked parent who approves their applications. We ask only for the information needed to run the service. A parent can see their linked child applications and hours.'],
    ['Who can see your information', ['You can see your own information.', 'A linked parent can see their child applications, hours and rewards.', 'Employers can see the name, age, application answers and hours of people who apply to their own activities.', 'Merchants can see the rewards redeemed at their business, not your identity documents.', 'Shababna administrators can see the information needed to verify accounts, give support and keep the platform safe.', 'An automated check reads your Civil ID photos to confirm your details. It uses an AI service provider that processes the photos for us, and a person reviews anything the check is unsure about.', 'Our service providers, such as hosting, database and payment providers, handle data for us under their own security rules.']],
    ['How we protect it', 'Civil ID photos are kept in private storage that only you and authorised administrators can open. Access to data is limited by role, and connections to the service are encrypted. No system is perfectly secure, so please keep your password private.'],
    ['How long we keep it', 'We keep your information while your account is active. If you ask us to delete your account, we delete or anonymise your information within a reasonable time, unless the law requires us to keep some of it.'],
    ['Your choices', 'You can ask to see, correct or delete your information, or ask a question about this policy, by contacting us.'],
    ['Local storage', 'We use your browser local storage only to keep you signed in and to remember light or dark mode. We do not use advertising trackers.'],
    ['Changes', 'If we change this policy we will update this page and the date or version shown at sign-up.']]],
  terms: ['Terms and Conditions', [
    ['About these terms', 'These terms are the agreement between you and Shababna. By creating an account you accept them and the Privacy Policy.'],
    ['Who can use Shababna', 'Shababna is for people aged 14 to 22. If you are under 18 you need a parent or guardian to link to your account and approve your activities.'],
    ['Your account', ['Give true and current information and keep your password private.', 'Use one account only, and do not share it.', 'We may ask you to verify your Civil ID. Some features stay locked until you are verified.']],
    ['Parents and guardians', 'A parent receives a personal parent code after their own Civil ID is verified. By sharing it with your child you allow them to link to you and you agree to review and decide on their applications.'],
    ['Activities and employers', ['Camps, organisations and companies that post activities are independent. Shababna connects people with them and is not their employer or agent.', 'Employers must give accurate information, supervise young people safely and score hours and performance honestly.', 'Activities are offered as volunteering, internships and skill development. Each employer is responsible for following the laws that apply to them.']],
    ['Rewards', 'Rewards are earned only from hours verified by an employer. Each business sets its own reward and the hours needed. Rewards have no cash value and can be cancelled if they are misused.'],
    ['Subscriptions and payments', 'Students pay a monthly subscription and employers pay a yearly subscription. The current price is shown on your subscription card, in Kuwaiti dinar. Payments are taken by a third-party payment provider. You can cancel at any time, and your plan stays active until the end of the period you paid for. Refunds are decided case by case unless the law says otherwise.'],
    ['Acceptable use', ['Do not give false information or use someone else identity or documents.', 'Do not harass, harm or mislead anyone, or put anyone at risk.', 'Do not try to break, copy or misuse the service or its data.']],
    ['Suspension and closing accounts', 'We may suspend or close an account that breaks these terms or puts others at risk. You can ask us to close your account at any time.'],
    ['Safety', 'If you have a safety concern about an activity or a person, tell us straight away. In an emergency, contact the emergency services first.'],
    ['Our responsibility', 'We work to keep Shababna safe and available, but we cannot promise it will always be free of errors or interruptions. To the extent the law allows, we are not responsible for the actions of employers, merchants or other users, or for losses we could not reasonably have prevented.'],
    ['Law', 'These terms are governed by the laws of the State of Kuwait.'],
    ['Changes', 'We may update these terms. When we do, we will update this page and ask you to accept the new version where the law requires it.']]]
};
function legal(kind, a) {
  const [title, secs] = LEGAL[kind];
  const body = secs.map(([h, t]) => `<h2>${h}</h2>${Array.isArray(t) ? `<ul>${t.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : `<p>${esc(t)}</p>`}`).join('');
  view(a && a.role ? a : null, `${LEGAL_DRAFT ? '<p class="note">Draft for review. This text has not yet been checked by a lawyer.</p>' : ''}<h1>${title}</h1><p class="mut">Version ${TERMS_VERSION}</p>${body}
  <h2>Contact</h2><p>${CONTACT_EMAIL ? `<a href="mailto:${esc(CONTACT_EMAIL)}">${esc(CONTACT_EMAIL)}</a>` : '<span class="note">Add your contact email in config.js before launch.</span>'}</p><p><a href="#/">Back</a></p>`);
}
async function route() {
  const [page, arg] = (location.hash.replace(/^#\/?/, '') || '').split('/');
  const a = await access();
  if (page === 'terms' || page === 'privacy') return legal(page, a);
  if (a.state === 'anon') {
    if (page === 'signup' && SELF.includes(arg)) return signup(arg);
    if (page === 'login') return login();
    return page ? go('#/login') : landing();
  }
  if (a.state === 'norole') return view(null, '<h1>No access</h1><p class="mut">No role is set for this account. Please contact support.</p><button class="btn alt" data-act="out">Sign out</button>');
  if (a.state === 'suspended') { await sb.auth.signOut(); return landing('Your account is suspended. Please contact support.'); }
  if (a.state === 'pending') return page === 'profile' ? profilePage(a) : go('#/profile');
  if (page === 'profile' && a.role !== 'admin') return profilePage(a);
  if (page !== a.role) return go(HOME[a.role]);              // wrong portal or unknown page: your own dashboard
  return ({ student, parent, employer, merchant, admin })[a.role](a);
}

function landing(msg) {
  view(null, `${msg ? `<p class="note">${esc(msg)}</p>` : ''}<h1>Real work experience for Kuwaiti teens</h1><p class="mut">Log in, or create an account.</p>
  <a class="btn" href="#/login">Log in</a><h2>New here? Sign up as</h2><div class="grid">${SELF.map((r) => `<a class="btn alt" href="#/signup/${r}">${cap(r)}</a>`).join('')}</div>`);
}
function login() {
  view(null, `<h1>Log in</h1><form data-form="login" class="card"><label>Email<input name="email" type="email" autocomplete="email" required></label>
  <label>Password<input name="password" type="password" autocomplete="current-password" required></label><button class="btn">Log in</button></form><a href="#/">Back</a>`);
}
function signup(role) {
  view(null, `<h1>Sign up as ${role}</h1><form data-form="signup" data-role="${role}" class="card"><label>Full name<input name="name" autocomplete="name" required></label>
  <label>Email<input name="email" type="email" autocomplete="email" required></label><label>Password <span class="mut">At least 8 characters</span><input name="password" type="password" minlength="8" autocomplete="new-password" required></label>
  <label class="chk"><input type="checkbox" name="terms" required> I agree to the <a href="#/terms">Terms and Conditions</a> and the <a href="#/privacy">Privacy Policy</a>.</label><button class="btn">Create account</button></form><a href="#/">Back</a>`);
}

async function profilePage(a) {
  const [{ data: me }, { data: v }] = await Promise.all([sb.from('profiles').select('full_name,email,phone,school,grade,about,interests').eq('id', a.id).single(), sb.from('id_verifications').select('status,dob_claimed,reject_reason').eq('user_id', a.id).maybeSingle()]);
  const needsId = ['student', 'parent'].includes(a.role), waiting = a.state === 'pending';
  const idBlock = !needsId ? (waiting ? '<div class="card"><b>Account approval</b> <span class="tag">Waiting</span><p class="mut">Our team is reviewing your account. You will get access once it is approved.</p></div>' : '')
    : v?.status === 'verified' ? `<div class="card"><b>Civil ID</b> <span class="tag">Verified</span>${v.dob_claimed ? `<p class="mut">Date of birth ${esc(v.dob_claimed)}</p>` : ''}</div>`
    : ['submitted', 'needs_review'].includes(v?.status) ? `<div class="card"><b>Civil ID</b> <span class="tag">Under review</span><p class="mut">${v.status === 'needs_review' ? 'A person is checking your ID. This usually takes about a day.' : 'We are checking your ID.'} You will get access once it is verified.</p>${v.status === 'needs_review' && v.reject_reason ? `<p class="mut sm">${esc(v.reject_reason)}</p>` : ''}</div>`
    : `<form data-form="id" class="card"><b>Civil ID</b> <span class="tag">${v?.status === 'rejected' ? 'Rejected, please upload again' : 'Not added yet'}</span>
  ${v?.status === 'rejected' && v.reject_reason ? `<p class="note">${esc(v.reject_reason)}</p>` : ''}
  <p class="mut">Upload the front and back of your Civil ID${a.role === 'student' ? ' and add your date of birth' : ''}. We use it only to verify who you are${a.role === 'student' ? ' and your age' : ''}.</p>
  ${a.role === 'student' ? '<label>Date of birth (as on your ID)<input name="dob" type="date" required></label>' : ''}
  <label>Front<input name="front" type="file" accept="image/*,application/pdf" required></label><label>Back<input name="back" type="file" accept="image/*,application/pdf" required></label><button class="btn">Submit for verification</button></form>`;
  view(a, `<h1>Your profile</h1>${waiting ? '<p class="note">Welcome! Add your details below to unlock your account.</p>' : ''}
  <form data-form="profile" class="card"><b>Your details</b><label>Full name<input name="name" value="${esc(me?.full_name)}" autocomplete="name" required></label>
  <label>Email<input value="${esc(me?.email)}" disabled></label><label>Phone number<input name="phone" type="tel" value="${esc(me?.phone)}" autocomplete="tel"></label>
  ${a.role === 'student' ? `<label>School<input name="school" value="${esc(me?.school)}"></label><label>Grade or year<select name="grade"><option value="">Choose</option>${['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'University'].map((g) => `<option ${me?.grade === g ? 'selected' : ''}>${g}</option>`).join('')}</select></label><label>About you<textarea name="about" rows="3" maxlength="300">${esc(me?.about)}</textarea></label><label>Interests <span class="mut">Separate with commas</span><input name="interests" value="${esc((me?.interests || []).join(', '))}"></label>` : ''}
  <button class="btn">Save details</button></form>
  ${idBlock}${waiting ? '' : `<p><a href="${HOME[a.role]}">Back to my dashboard</a></p>`}`);
}

async function subCard(a) {
  const code = a.role === 'student' ? 'student_monthly' : 'employer_yearly';
  const [{ data: p }, { data: s }] = await Promise.all([sb.from('plans').select('amount,period,currency').eq('code', code).single(), sb.from('subscriptions').select('status,current_period_end').maybeSingle()]);
  const on = s && s.status === 'active' && new Date(s.current_period_end) > new Date();
  return `<div class="card"><b>Subscription</b> <span class="tag">${on ? 'Active' : 'Not active'}</span><p class="mut">${p ? `${esc(p.currency)} ${Number(p.amount).toFixed(3)} per ${esc(p.period)}` : ''}${on ? ` · paid until ${new Date(s.current_period_end).toLocaleDateString('en-GB')}` : ''}</p>${on ? '' : `<button class="btn" data-act="pay" data-plan="${code}">Pay and subscribe</button>`}</div>`;
}
const ST = { tab: 'explore', cert: null };
const kindLabel = (k) => ({ camp: 'Camp', volunteering: 'Volunteering', internship: 'Internship' }[k] || k);
const avgScore = (sc) => { const v = Object.values(sc || {}).map(Number); return v.length ? (v.reduce((n, x) => n + x, 0) / v.length).toFixed(1) : '-'; };
const appStatus = (x) => x.log_status === 'verified' ? 'Completed' : x.log_status === 'revoked' ? 'Hours revoked' : x.decision === 'declined' ? 'Declined' : x.decision === 'accepted' ? 'Accepted' : x.decision === 'interview' ? 'Interview' : x.parent_consent ? 'Under review' : 'Waiting for parent';
const day = (t) => new Date(t).toLocaleDateString('en-GB', { dateStyle: 'medium' });

async function student(a) {
  const tabs = `<div class="tabs noprint">${[['explore', 'Explore'], ['history', 'History'], ['cv', 'My CV'], ['rewards', 'Rewards']].map(([k, l]) => `<button class="ghost" data-act="stab" data-v="${k}" aria-pressed="${ST.tab === k}">${l}</button>`).join('')}</div>`;
  if (ST.cert) {
    const { data } = await sb.rpc('my_applications'); const x = (data || []).find((r) => r.application_id === ST.cert);
    if (x) return certificate(a, x); ST.cert = null;
  }
  if (ST.tab === 'history') return historyView(a, tabs);
  if (ST.tab === 'cv') return cvView(a, tabs);
  if (ST.tab === 'rewards') return rewardsView(a, tabs);
  return exploreView(a, tabs);
}
async function historyView(a, tabs) {
  const { data } = await sb.rpc('my_applications'); const apps = data || [];
  const done = apps.filter((x) => x.log_status === 'verified'), total = done.reduce((n, x) => n + x.log_hours, 0);
  view(a, `<h1>History</h1>${tabs}<div class="stats"><div class="card"><b>${total}</b><p class="mut">verified hours</p></div><div class="card"><b>${done.length}</b><p class="mut">activities completed</p></div></div>
  <h2>My applications</h2>${apps.map((x) => `<article class="card"><span class="tag">${appStatus(x)}</span> <b>${esc(x.title)}</b><p class="mut">${esc(x.org)} · ${kindLabel(x.kind)} · ${x.activity_hours} hours · applied ${day(x.applied_at)}</p>${x.log_status === 'verified' ? `<p class="mut">${x.log_hours} hours verified · score ${avgScore(x.scores)}/5 · completed ${day(x.completed_at)}</p><button class="btn alt" data-act="cert" data-id="${x.application_id}">Certificate</button>` : ''}</article>`).join('') || '<p class="mut">You have not applied for anything yet. Find an activity in Explore.</p>'}`);
}
async function cvView(a, tabs) {
  const [{ data: me }, { data }] = await Promise.all([sb.from('profiles').select('full_name,email,phone,school,grade,about,interests').eq('id', a.id).single(), sb.rpc('my_applications')]);
  const done = (data || []).filter((x) => x.log_status === 'verified'), total = done.reduce((n, x) => n + x.log_hours, 0);
  const sc = done.map((x) => Number(avgScore(x.scores))).filter((n) => !isNaN(n));
  view(a, `<h1>My CV</h1>${tabs}<article class="card"><h2 style="margin-top:0">${esc(me?.full_name)}</h2><p class="mut">${esc([me?.grade, me?.school].filter(Boolean).join(' · '))}</p><p class="mut">${esc([me?.email, me?.phone].filter(Boolean).join(' · '))}</p>
  ${me?.about ? `<p>${esc(me.about)}</p>` : ''}${me?.interests?.length ? `<p><b>Interests:</b> ${esc(me.interests.join(', '))}</p>` : ''}
  <p><b>${total}</b> verified hours · <b>${done.length}</b> completed activities${sc.length ? ` · average score <b>${(sc.reduce((n, x) => n + x, 0) / sc.length).toFixed(1)}</b>/5` : ''}</p>
  <h3>Experience</h3>${done.map((x) => `<div class="cvi"><b>${esc(x.title)}</b> · ${esc(x.org)}<br><span class="mut">${kindLabel(x.kind)} · ${x.log_hours} hours · completed ${day(x.completed_at)} · score ${avgScore(x.scores)}/5</span></div>`).join('') || '<p class="mut">Completed activities appear here once an employer verifies your hours.</p>'}
  <p class="mut sm">Hours and scores were verified by the supervising organisations through Shababna.</p></article>
  <button class="btn noprint" data-act="print">Download or print CV</button><p class="mut sm noprint">Your browser opens its print window. Choose Save as PDF to download it.</p>
  ${me?.school ? '' : '<p class="note noprint">Add your school, grade, about and interests in <a href="#/profile">Profile</a> to complete your CV.</p>'}`);
}
async function rewardsView(a, tabs) {
  const [{ data: hrs }, { data: offers }, { data: coupons }] = await Promise.all([sb.rpc('my_hours'), sb.rpc('reward_offers'), sb.rpc('my_coupons')]);
  const total = hrs || 0, text = (o) => o.kind === 'percent' ? `${o.percent}% off one item` : `Free ${o.product}`;
  view(a, `<h1>Rewards</h1>${tabs}<div class="card"><b style="font-size:26px">${total}</b> <span class="mut">verified hours</span><p class="mut sm">Each business decides how many verified hours unlock its reward. Hours count once an employer approves them.</p></div>
  ${(coupons || []).length ? `<h2>My coupons</h2>${coupons.map((c) => `<div class="card"><b>${esc(c.brand)}</b> <span class="tag">${c.voided ? 'Voided' : 'Ready to use'}</span><p class="mut">${esc(c.offer_text)}</p><div class="code">${esc(c.code)}</div></div>`).join('')}` : ''}
  <h2>Rewards you can earn</h2>${(offers || []).map((o) => { const ok = Math.floor(total / o.hours_required) > o.used, need = Math.max(0, o.hours_required * (o.used + 1) - total), pct = Math.max(0, Math.min(100, Math.round(((total - o.hours_required * o.used) / o.hours_required) * 100)));
    return `<article class="card"><b>${esc(o.brand)}</b><p>${esc(text(o))}</p><p class="mut sm">Every ${o.hours_required} verified hours</p><div class="bar"><i style="width:${pct}%"></i></div>${ok ? `<button class="btn" data-act="redeem" data-id="${o.merchant_id}">Redeem</button>` : `<p class="mut sm">${need} more hours to unlock</p>`}</article>`; }).join('') || '<p class="mut">No rewards are available yet.</p>'}`);
}
async function certificate(a, x) {
  const { data: me } = await sb.from('profiles').select('full_name').eq('id', a.id).single();
  view(a, `<div class="cert"><p class="mut">shababna</p><h1>Certificate of Achievement</h1><p>This certifies that</p><h2>${esc(me?.full_name)}</h2><p>successfully completed</p><h3>${esc(x.title)}</h3><p>${esc(x.org)} · ${x.log_hours} verified hours</p><p class="mut sm">Completed ${day(x.completed_at)} · Hours verified by the supervising organisation · Issued via Shababna</p></div>
  <div class="noprint"><button class="btn" data-act="print">Download or print</button> <button class="btn alt" data-act="certback">Back</button></div>`);
}
async function exploreView(a, tabs) {
  const { data: age } = await sb.rpc('student_age', { uid: a.id });
  const { data: links } = await sb.from('parent_links').select('parent_id');
  const need = age !== null && age < 18 && !(links && links.length);
  const { data: acts } = await sb.from('activities').select('id,title,kind,location,hours,description').order('created_at', { ascending: false });
  const sub = await subCard(a);
  view(a, `<h1>Hi ${esc((a.name || '').split(' ')[0])}</h1>${tabs}${sub}
  ${need ? `<form data-form="link" class="card"><b>Link a parent</b><p class="mut">You are under 18. Enter your parent's code to apply.</p><input name="code" placeholder="Parent code" required><button class="btn">Link parent</button></form>` : ''}
  <h2>Open activities</h2>${(acts || []).map((x) => `<article class="card"><span class="tag">${esc(x.kind)}</span><h3>${esc(x.title)}</h3><p class="mut">${esc(x.location || '')} · ${x.hours} hours</p><p>${esc(x.description || '')}</p><button class="btn" data-act="apply" data-id="${x.id}" ${need ? 'disabled' : ''}>Apply</button></article>`).join('') || '<p class="mut">No activities yet.</p>'}`);
}
async function parent(a) {
  const { data: pc } = await sb.from('parent_codes').select('code').maybeSingle();
  const { data: kids } = await sb.rpc('parent_children');
  const { data: apps } = await sb.from('applications').select('id,student_id,activities(title)').eq('parent_consent', false).neq('decision', 'declined');
  const nm = Object.fromEntries((kids || []).map((k) => [k.student_id, k.full_name]));
  view(a, `<h1>Your parent code</h1><div class="card"><b style="font-size:24px;letter-spacing:.08em">${esc(pc?.code || 'Not issued yet')}</b><p class="mut">Give this code to your teen so they can link to you.</p></div>
  <h2>Approvals</h2>${(apps || []).map((x) => `<article class="card"><b>${esc(nm[x.student_id] || 'Your teen')}</b><p class="mut">${esc(x.activities?.title || '')}</p><button class="btn" data-act="pdecide" data-id="${x.id}" data-ok="1">Approve</button> <button class="btn alt" data-act="pdecide" data-id="${x.id}" data-ok="0">Decline</button></article>`).join('') || '<p class="mut">Nothing waiting for you.</p>'}`);
}
let HM = null;
const hoursModal = () => `<div class="mo"><form class="mc" data-form="hours"><h2>Approve hours</h2><p class="mut">Score the student, then approve their hours. This creates their certificate and counts toward rewards.</p><input type="hidden" name="app" value="${esc(HM)}">
  ${['punctuality', 'leadership', 'communication'].map((n) => `<label>${cap(n)} (1 to 5)<select name="${n}">${[5, 4, 3, 2, 1].map((v) => `<option>${v}</option>`).join('')}</select></label>`).join('')}
  <button class="btn">Approve hours</button> <button class="btn alt" type="button" data-act="hclose">Cancel</button></form></div>`;
async function employer(a) {
  const { data: logs } = await sb.from('hours_logs').select('application_id'); const logged = new Set((logs || []).map((l) => l.application_id));
  const { data: acts } = await sb.from('activities').select('id,title,kind,hours').eq('employer_id', a.id);
  const { data: ap } = await sb.rpc('employer_applicants');
  const t = Object.fromEntries((acts || []).map((x) => [x.id, x.title]));
  const sub = await subCard(a);
  view(a, `<h1>Your activities</h1>${sub}${(acts || []).map((x) => `<div class="card"><span class="tag">${esc(x.kind)}</span> <b>${esc(x.title)}</b> <span class="mut">${x.hours} hours</span></div>`).join('') || '<p class="mut">None yet.</p>'}
  <form data-form="activity" class="card"><b>New activity</b><label>Title<input name="title" required></label><label>Type<select name="kind"><option value="camp">Camp</option><option value="volunteering">Volunteering</option><option value="internship">Internship</option></select></label>
  <label>Location<input name="location"></label><label>Hours<input name="hours" type="number" min="1" required></label><label>Description<textarea name="description" rows="3"></textarea></label><label>Question for applicants<input name="question"></label><button class="btn">Publish activity</button></form>
  <h2>Applicants</h2>${(ap || []).map((x) => `<article class="card"><b>${esc(x.student_name || 'Student')}</b> <span class="mut">${esc(t[x.activity_id] || '')}</span><p class="mut">${x.parent_consent ? 'Parent approved' : 'Waiting for parent'} · ${esc(x.decision)}</p><p>${esc(x.answers?.why || '')}</p>
  <button class="btn" data-act="decide" data-id="${x.application_id}" data-d="accepted" ${x.parent_consent ? '' : 'disabled'}>Accept</button> <button class="btn alt" data-act="decide" data-id="${x.application_id}" data-d="interview">Interview</button> <button class="btn alt" data-act="decide" data-id="${x.application_id}" data-d="declined">Decline</button>${x.decision === 'accepted' ? (logged.has(x.application_id) ? '<span class="tag">Hours approved</span>' : `<button class="btn" data-act="hours" data-id="${x.application_id}">Score and approve hours</button>`) : ''}</article>`).join('') || '<p class="mut">No applicants yet.</p>'}${HM ? hoursModal() : ''}`);
}
async function merchant(a) {
  const { data: o } = await sb.from('offers').select('*').eq('merchant_id', a.id).maybeSingle();
  const { data: reds } = await sb.from('redemptions').select('id,code,offer_text,created_at').order('created_at', { ascending: false });
  view(a, `<h1>Your offer</h1><form data-form="offer" class="card"><label>Verified hours needed<input name="hours_required" type="number" min="1" max="500" value="${o?.hours_required ?? 70}" required></label>
  <label>Reward type<select name="kind"><option value="percent" ${o?.kind !== 'product' ? 'selected' : ''}>Percentage off</option><option value="product" ${o?.kind === 'product' ? 'selected' : ''}>Free product</option></select></label>
  <label>Percentage<input name="percent" type="number" min="1" max="100" value="${o?.percent ?? 25}"></label><label>Free product<input name="product" value="${esc(o?.product || '')}"></label><button class="btn">Save offer</button></form>
  <h2>Redemptions (${(reds || []).length})</h2>${(reds || []).map((r) => `<div class="card"><b>${esc(r.offer_text)}</b> <span class="mut">${esc(r.code)}</span></div>`).join('') || '<p class="mut">None yet.</p>'}`);
}
const A = { modal: null, tab: 'overview', q: '', role: 'all', status: 'all', fq: false, d: {}, pending: 0, a: null };
const NAVG = [['Overview', [['overview', 'Overview']]], ['People', [['users', 'Users'], ['ids', 'Civil IDs']]], ['Marketplace', [['listings', 'Listings'], ['apps', 'Applications'], ['hours', 'Hours']]], ['Business', [['biz', 'Businesses and rewards']]], ['Finance', [['money', 'Subscriptions']]], ['System', [['log', 'Audit log']]]];
const TITLES = { overview: 'Overview', users: 'Users', ids: 'Civil ID review', listings: 'Listings', apps: 'Applications', hours: 'Logged hours', biz: 'Businesses and rewards', money: 'Subscriptions and payments', log: 'Audit log' };
const when = (t) => new Date(t).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
const GOOD = ['active', 'verified', 'redeemed', 'paid', 'accepted', 'approved', 'on'], WARN = ['pending', 'submitted', 'needs_review', 'interview', 'new'], BAD = ['suspended', 'rejected', 'revoked', 'voided', 'declined', 'canceled', 'expired', 'missing'];
const bd = (t) => { const k = String(t).toLowerCase().split(' ')[0]; return `<span class="bd ${GOOD.includes(k) ? 'g' : WARN.includes(k) ? 'w' : BAD.includes(k) ? 'r' : ''}">${esc(t)}</span>`; };
const sbn = (label, act, d = {}, k = '') => `<button class="sbn ${k}" data-act="${act}" ${Object.entries(d).map(([n, v]) => `data-${n}="${esc(v)}"`).join(' ')}>${label}</button>`;
const tbl = (cols, rows, empty) => rows.length ? `<div class="tw"><table class="tbl"><thead><tr>${cols.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : `<p class="amut pad">${empty}</p>`;
const panel = (title, body, tools = '') => `<section class="pn"><div class="ph"><h2>${title}</h2><div class="tb">${tools}</div></div>${body}</section>`;
const cnt = (t, f) => { let q = sb.from(t).select('*', { count: 'exact', head: true }); if (f) q = f(q); return q.then((r) => r.count || 0); };
const acct = (u, me) => u.id === me ? '' : [u.status !== 'active' ? sbn('Activate', 'status', { id: u.id, s: 'active' }) : '', u.status !== 'suspended' ? sbn('Suspend', 'status', { id: u.id, s: 'suspended' }, 'dn') : ''].join('');

const listingForm = (emps, x) => `<div class="mo"><form class="mc" data-form="adm-listing"><h2>${x ? 'Edit listing' : 'Add listing'}</h2>
  ${x ? `<input type="hidden" name="id" value="${esc(x.id)}">` : `<label>Employer<select name="employer_id" required>${emps.map((u) => `<option value="${u.id}">${esc(u.full_name)}</option>`).join('')}</select></label>${emps.length ? '' : '<p class="amut">There are no employer accounts yet.</p>'}`}
  <label>Title<input name="title" value="${esc(x?.title)}" required></label>
  <label>Type<select name="kind">${['camp', 'volunteering', 'internship'].map((k) => `<option ${x?.kind === k ? 'selected' : ''}>${k}</option>`).join('')}</select></label>
  <label>Location<input name="location" value="${esc(x?.location)}"></label><label>Hours<input name="hours" type="number" min="1" value="${esc(x?.hours)}" required></label>
  <label>Description<textarea name="description" rows="3">${esc(x?.description)}</textarea></label><label>Question for applicants<input name="question" value="${esc(x?.question)}"></label>
  <button class="btn">Save</button> <button class="btn alt" type="button" data-act="mclose">Cancel</button></form></div>`;
const offerForm = (mers, x) => `<div class="mo"><form class="mc" data-form="adm-offer"><h2>${x ? 'Edit offer' : 'Add offer'}</h2>
  ${x ? `<input type="hidden" name="mid" value="${esc(x.merchant_id)}"><p><b>${esc(x.profiles?.full_name)}</b></p>` : `<label>Merchant<select name="mid" required>${mers.map((u) => `<option value="${u.id}">${esc(u.full_name)}</option>`).join('')}</select></label>${mers.length ? '' : '<p class="amut">There are no merchant accounts yet.</p>'}`}
  <label>Verified hours needed<input name="hours_required" type="number" min="1" max="500" value="${esc(x?.hours_required ?? 70)}" required></label>
  <label>Reward type<select name="kind"><option value="percent" ${x?.kind !== 'product' ? 'selected' : ''}>Percentage off</option><option value="product" ${x?.kind === 'product' ? 'selected' : ''}>Free product</option></select></label>
  <label>Percentage<input name="percent" type="number" min="1" max="100" value="${esc(x?.percent ?? 25)}"></label><label>Free product<input name="product" value="${esc(x?.product)}"></label>
  <button class="btn">Save</button> <button class="btn alt" type="button" data-act="mclose">Cancel</button></form></div>`;
async function load(tab, a) {
  const q = (t, cols, o) => sb.from(t).select(cols).order(o || 'created_at', { ascending: false }).then((r) => r.data || []);
  if (tab === 'overview') {
    const [users, ids, pend, listings, apps, redemptions, hrs, pays] = await Promise.all([cnt('profiles'), cnt('id_verifications', (x) => x.in('status', ['submitted', 'needs_review'])), cnt('profiles', (x) => x.eq('status', 'pending').in('role', ['employer', 'merchant'])), cnt('activities'), cnt('applications'), cnt('redemptions'),
      sb.from('hours_logs').select('hours').eq('status', 'verified').then((r) => (r.data || []).reduce((n, h) => n + h.hours, 0)), sb.from('payments').select('amount').eq('status', 'paid').then((r) => (r.data || []).reduce((n, p) => n + Number(p.amount), 0))]);
    return { users, ids, pend, listings, apps, redemptions, hrs, pays };
  }
  if (tab === 'users') return { users: await q('profiles', 'id,full_name,email,phone,role,status,created_at') };
  if (tab === 'ids') return { ids: await q('id_verifications', 'user_id,status,front_path,back_path,dob_claimed,created_at,reject_reason,check_result,profiles!user_id(full_name,role,email)') };
  if (tab === 'listings') return { rows: await q('activities', 'id,employer_id,title,kind,location,hours,description,question,created_at,profiles(full_name)'), emps: await sb.from('profiles').select('id,full_name').eq('role', 'employer').then((r) => r.data || []) };
  if (tab === 'apps') return { rows: await q('applications', 'id,parent_consent,decision,created_at,activities(title),profiles!student_id(full_name)') };
  if (tab === 'hours') return { rows: await q('hours_logs', 'id,hours,status,scores,created_at,applications(profiles!student_id(full_name),activities(title))') };
  if (tab === 'biz') return { acc: (await q('profiles', 'id,full_name,email,phone,role,status,created_at')).filter((u) => ['merchant', 'employer'].includes(u.role)), off: await sb.from('offers').select('merchant_id,hours_required,kind,percent,product,profiles(full_name)').then((r) => r.data || []), red: await q('redemptions', 'id,code,offer_text,voided,created_at,student:profiles!student_id(full_name),merchant:profiles!merchant_id(full_name)') };
  if (tab === 'money') { const [set, subs, pays, plans] = await Promise.all([sb.from('app_settings').select('value').eq('key', 'require_subscription').single().then((r) => r.data), sb.from('subscriptions').select('user_id,plan_code,status,current_period_end,profiles(full_name,email)').then((r) => r.data || []), q('payments', 'id,amount,currency,provider,status,created_at,profiles(full_name)'), sb.from('plans').select('code,role,period,amount,currency').then((r) => r.data || [])]); return { set, subs, pays, plans }; }
  return { rows: (await sb.from('audit_log').select('action,target,details,at').order('at', { ascending: false }).limit(200)).data || [] };
}
async function admin(a) {
  A.a = a; A.pending = await cnt('id_verifications', (x) => x.in('status', ['submitted', 'needs_review'])); A.d = await load(A.tab, a); paint();
}
function paint() {
  const a = A.a, d = A.d, T = A.tab; let body = '';
  const opt = (list, cur) => list.map(([v, l]) => `<option value="${v}" ${v === cur ? 'selected' : ''}>${l}</option>`).join('');
  if (T === 'overview') {
    const tile = (n, l, go) => `<${go ? 'button' : 'div'} class="tile" ${go ? `data-act="atab" data-v="${go}"` : ''}><b>${n}</b><span>${l}</span></${go ? 'button' : 'div'}>`;
    body = `<div class="tiles">${tile(d.users, 'Total users', 'users')}${tile(d.ids, 'Civil IDs waiting', 'ids')}${tile(d.pend, 'Business accounts waiting', 'biz')}${tile(d.listings, 'Listings', 'listings')}${tile(d.apps, 'Applications', 'apps')}${tile(d.hrs, 'Verified hours', 'hours')}${tile(d.redemptions, 'Reward redemptions', 'biz')}${tile('KD ' + d.pays.toFixed(3), 'Payments received', 'money')}</div>
    ${panel('Needs attention', d.ids + d.pend ? `<ul class="att">${d.ids ? `<li>${d.ids} Civil ID${d.ids === 1 ? '' : 's'} to review ${sbn('Review', 'atab', { v: 'ids' })}</li>` : ''}${d.pend ? `<li>${d.pend} business account${d.pend === 1 ? '' : 's'} to approve ${sbn('Review', 'atab', { v: 'biz' })}</li>` : ''}</ul>` : '<p class="amut pad">Nothing waiting. You are all caught up.</p>')}`;
  } else if (T === 'users') {
    const t = A.q.toLowerCase(), L = d.users.filter((u) => (A.role === 'all' || u.role === A.role) && (A.status === 'all' || u.status === A.status) && (!t || `${u.full_name} ${u.email} ${u.phone || ''}`.toLowerCase().includes(t)));
    const tools = `<input class="sq" data-aq value="${esc(A.q)}" placeholder="Search name, email or phone" aria-label="Search users"><select class="sq" data-af="role" aria-label="Filter by role">${opt([['all', 'All roles'], ['student', 'Students'], ['parent', 'Parents'], ['employer', 'Employers'], ['merchant', 'Merchants'], ['admin', 'Admins']], A.role)}</select><select class="sq" data-af="status" aria-label="Filter by status">${opt([['all', 'Any status'], ['pending', 'Pending'], ['active', 'Active'], ['suspended', 'Suspended']], A.status)}</select>`;
    body = panel(`Users <span class="amut">${L.length} of ${d.users.length}</span>`, tbl(['Name', 'Email', 'Phone', 'Role', 'Status', 'Joined', 'Actions'], L.map((u) => [`<b>${esc(u.full_name || '(no name)')}</b>`, esc(u.email), esc(u.phone || '-'), bd(u.role), bd(u.status), when(u.created_at), u.id === a.id ? '<span class="amut">You</span>' : acct(u, a.id) + sbn('Edit', 'uedit', { id: u.id, name: u.full_name || '', phone: u.phone || '' }) + sbn('Role', 'urole', { id: u.id })]), 'No users match.'), tools);
  } else if (T === 'ids') {
    body = panel('Civil ID uploads', tbl(['Person', 'Role', 'Born', 'Uploaded', 'Status', 'Automatic check', 'Actions'], d.ids.map((x) => [`<b>${esc(x.profiles?.full_name)}</b><br><span class="amut">${esc(x.profiles?.email)}</span>`, bd(x.profiles?.role || ''), esc(x.dob_claimed || '-'), when(x.created_at), bd(x.status), `${x.reject_reason ? esc(x.reject_reason) : '<span class="amut">-</span>'}${(x.check_result?.flags || []).length ? `<br><span class="amut">${esc(x.check_result.flags.join(', '))}</span>` : ''}`, sbn('Front', 'photo', { p: x.front_path }) + sbn('Back', 'photo', { p: x.back_path }) + (['submitted', 'needs_review'].includes(x.status) ? sbn('Verify', 'idreview', { id: x.user_id, ok: 1 }, 'ok') + sbn('Reject', 'idreview', { id: x.user_id, ok: 0 }, 'dn') : '')]), 'No uploads yet.'));
  } else if (T === 'listings') {
    body = panel('All listings', tbl(['Title', 'Employer', 'Type', 'Hours', 'Location', 'Created', 'Actions'], d.rows.map((x) => [`<b>${esc(x.title)}</b>`, esc(x.profiles?.full_name), bd(x.kind), x.hours, esc(x.location || '-'), when(x.created_at), sbn('Edit', 'medit', { t: 'listing', id: x.id }) + sbn('Delete', 'adel', { id: x.id }, 'dn')]), 'No listings yet.'), sbn('+ Add listing', 'madd', { t: 'listing' }, 'ok'));
  } else if (T === 'apps') {
    body = panel('All applications', tbl(['Student', 'Activity', 'Decision', 'Parent consent', 'Submitted', 'Actions'], d.rows.map((x) => [`<b>${esc(x.profiles?.full_name)}</b>`, esc(x.activities?.title), bd(x.decision), x.parent_consent ? bd('approved') : bd('missing'), when(x.created_at), x.parent_consent ? sbn('Revoke consent', 'consent', { id: x.id, ok: 0 }, 'dn') : sbn('Approve consent', 'consent', { id: x.id, ok: 1 }, 'ok')]), 'No applications yet.'));
  } else if (T === 'hours') {
    body = panel('Logged hours', tbl(['Student', 'Activity', 'Hours', 'Scores', 'Status', 'Actions'], d.rows.map((x) => [`<b>${esc(x.applications?.profiles?.full_name)}</b>`, esc(x.applications?.activities?.title), x.hours, esc(Object.values(x.scores || {}).join(' / ')), bd(x.status), x.status === 'verified' ? sbn('Revoke', 'hstat', { id: x.id, s: 'revoked' }, 'dn') : sbn('Restore', 'hstat', { id: x.id, s: 'verified' }, 'ok')]), 'No hours logged yet.'));
  } else if (T === 'biz') {
    body = panel('Business accounts', tbl(['Name', 'Email', 'Phone', 'Type', 'Status', 'Actions'], d.acc.map((u) => [`<b>${esc(u.full_name)}</b>`, esc(u.email), esc(u.phone || '-'), bd(u.role), bd(u.status), acct(u, a.id)]), 'No business accounts yet.'))
      + panel('Offers', tbl(['Merchant', 'Hours needed', 'Reward', 'Actions'], d.off.map((o) => [`<b>${esc(o.profiles?.full_name)}</b>`, o.hours_required, o.kind === 'percent' ? o.percent + '% off' : 'Free ' + esc(o.product), sbn('Edit', 'medit', { t: 'offer', id: o.merchant_id }) + sbn('Delete', 'odel', { id: o.merchant_id }, 'dn')]), 'No offers yet.'), sbn('+ Add offer', 'madd', { t: 'offer' }, 'ok'))
      + panel('Reward redemptions', tbl(['Merchant', 'Student', 'Reward', 'Code', 'Date', 'Status', 'Actions'], d.red.map((r) => [`<b>${esc(r.merchant?.full_name)}</b>`, esc(r.student?.full_name), esc(r.offer_text), esc(r.code), when(r.created_at), bd(r.voided ? 'voided' : 'redeemed'), sbn(r.voided ? 'Restore' : 'Void', 'void', { id: r.id, v: r.voided ? 0 : 1 }, r.voided ? 'ok' : 'dn')]), 'No redemptions yet.'));
  } else if (T === 'money') {
    const on = d.set?.value === 'true';
    body = panel('Paid plans', `<div class="row2"><div><b>Require a paid plan</b> ${bd(on ? 'on' : 'off')}<p class="amut">When on, students cannot apply and employers cannot publish without an active plan.</p></div><div>${sbn(on ? 'Turn off' : 'Turn on', 'setting', { v: on ? 'false' : 'true' })}${sbn('Grant a plan by email', 'grant')}</div></div>`)
      + panel('Plan prices', tbl(['Plan', 'For', 'Billed', 'Price', 'Actions'], d.plans.map((p) => [`<b>${esc(p.code)}</b>`, bd(p.role), `every ${esc(p.period)}`, `${esc(p.currency)} ${Number(p.amount).toFixed(3)}`, sbn('Edit price', 'plan', { c: p.code, a: p.amount })]), 'No plans.'))
      + panel('Subscriptions', tbl(['Person', 'Plan', 'Status', 'Paid until', 'Actions'], d.subs.map((x) => [`<b>${esc(x.profiles?.full_name)}</b><br><span class="amut">${esc(x.profiles?.email)}</span>`, esc(x.plan_code), bd(x.status), when(x.current_period_end), x.status === 'active' ? sbn('Cancel', 'subcancel', { id: x.user_id }, 'dn') : '']), 'No subscriptions yet.'))
      + panel('Payments', tbl(['Person', 'Amount', 'Provider', 'Status', 'Date'], d.pays.map((p) => [`<b>${esc(p.profiles?.full_name)}</b>`, `${esc(p.currency)} ${Number(p.amount).toFixed(3)}`, esc(p.provider), bd(p.status), when(p.created_at)]), 'No payments yet.'));
  } else {
    body = panel('Every admin change', tbl(['When', 'Action', 'Target', 'Details'], d.rows.map((l) => [when(l.at), `<b>${esc(l.action)}</b>`, esc(l.target || '-'), `<span class="amut">${esc(JSON.stringify(l.details || {}))}</span>`]), 'No changes yet.'));
  }
  const nav = NAVG.map(([g, items]) => `<div class="ng">${g}</div>${items.map(([k, l]) => `<button class="ni" data-act="atab" data-v="${k}" aria-current="${A.tab === k}">${l}${k === 'ids' && A.pending ? `<i>${A.pending}</i>` : ''}</button>`).join('')}`).join('');
  $('#app').innerHTML = `<div class="adm"><aside><div class="brand">shababna<small>Admin console</small></div><nav>${nav}</nav><div class="aft"><span>${esc(a.name || 'Admin')}</span><button class="ni" data-act="out">Sign out</button></div></aside>
  <section class="am"><div class="topbar"><h1>${TITLES[T]}</h1>${themeBtn('sbn')}</div>${body}</section>${A.modal ? (A.modal.type === 'listing' ? listingForm(d.emps || [], A.modal.x) : offerForm((d.acc || []).filter((u) => u.role === 'merchant'), A.modal.x)) : ''}</div>`;
  if (A.fq) { const i = $('[data-aq]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }
}

document.addEventListener('submit', async (e) => {
  const f = e.target.dataset.form; if (!f) return; e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target)), btn = e.target.querySelector('button'); btn.disabled = true;
  try {
    if (f === 'login') { const { error } = await sb.auth.signInWithPassword({ email: d.email, password: d.password }); if (error) throw error; return go('#/'); }
    if (f === 'signup') {
      const role = e.target.dataset.role; if (!SELF.includes(role)) throw new Error('Invalid role');
      const { data, error } = await sb.auth.signUp({ email: d.email, password: d.password, options: { data: { role, full_name: d.name, accepted_terms: d.terms ? 'true' : 'false', terms_version: TERMS_VERSION }, emailRedirectTo: location.origin + location.pathname } });
      if (error) throw error;
      if (!data.session) return view(null, '<h1>Check your email</h1><p class="mut">We sent you a link to confirm your account. After confirming, log in.</p><a class="btn" href="#/login">Log in</a>');
      return go('#/');
    }
    const a = await access();
    if (f === 'id') {
      const ext = (x) => (x.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5), t = Date.now();
      const fp = `${a.id}/${t}-front.${ext(d.front)}`, bp = `${a.id}/${t}-back.${ext(d.back)}`;
      for (const [p, file] of [[fp, d.front], [bp, d.back]]) { if (file.size > 5 * 1024 * 1024) throw new Error('Each file must be under 5 MB'); const { error } = await sb.storage.from('civil-ids').upload(p, file); if (error) throw error; }
      const row = { user_id: a.id, front_path: fp, back_path: bp }; if (a.role === 'student') row.dob_claimed = d.dob;
      await sb.from('id_verifications').delete().eq('user_id', a.id).eq('status', 'rejected');
      const { error } = await sb.from('id_verifications').insert(row); if (error) throw error;
      toast('Checking your ID...');
      try { const { data: r } = await sb.functions.invoke('verify-civil-id', { body: {} }); toast(r?.status === 'verified' ? 'Your ID is verified. Welcome!' : r?.status === 'rejected' ? (r.reason || 'Your ID was not accepted.') : 'Submitted. A person will check your ID.'); } catch (_) { toast('Submitted. A person will check your ID.'); }
      return route();
    }
    if (f === 'profile') { const { error } = await sb.from('profiles').update({ full_name: d.name.trim(), phone: d.phone.trim() || null, ...(a.role === 'student' ? { school: (d.school || '').trim() || null, grade: d.grade || null, about: (d.about || '').trim() || null, interests: (d.interests || '').split(',').map((t) => t.trim()).filter(Boolean) } : {}) }).eq('id', a.id); if (error) throw error; toast('Saved'); return route(); }
    if (f === 'hours') { const { error } = await sb.rpc('employer_approve_hours', { app: d.app, punctuality: +d.punctuality, leadership: +d.leadership, communication: +d.communication }); if (error) throw error; HM = null; toast('Hours approved. The certificate is now in the student history.'); return route(); }
    if (f === 'adm-listing') {
      const row = { title: d.title, kind: d.kind, location: d.location, hours: +d.hours, description: d.description, question: d.question };
      const { error } = d.id ? await sb.from('activities').update(row).eq('id', d.id) : await sb.from('activities').insert({ employer_id: d.employer_id, ...row });
      if (error) throw error; A.modal = null; toast('Saved'); return route();
    }
    if (f === 'adm-offer') {
      const row = { hours_required: +d.hours_required, kind: d.kind, percent: d.kind === 'percent' ? +d.percent : null, product: d.kind === 'product' ? d.product : null };
      const { data: ex } = await sb.from('offers').select('merchant_id').eq('merchant_id', d.mid).maybeSingle();
      const { error } = ex ? await sb.from('offers').update(row).eq('merchant_id', d.mid) : await sb.from('offers').insert({ merchant_id: d.mid, ...row });
      if (error) throw error; A.modal = null; toast('Saved'); return route();
    }
    if (f === 'link') { const { data, error } = await sb.rpc('link_parent', { p_code: d.code }); if (error) throw error; toast({ linked: 'Parent linked', invalid_code: 'That code is not valid', too_many_attempts: 'Too many tries. Try again later.', verify_id_first: 'Verify your Civil ID first', not_needed: 'You do not need a parent' }[data] || data); return route(); }
    if (f === 'activity') { const { error } = await sb.from('activities').insert({ employer_id: a.id, title: d.title, kind: d.kind, location: d.location, hours: +d.hours, description: d.description, question: d.question }); if (error) throw new Error(error.code === '42501' || /row-level security/i.test(error.message) ? 'You need an active yearly subscription to publish activities.' : error.message); toast('Activity published'); return route(); }
    if (f === 'offer') {
      const row = { hours_required: +d.hours_required, kind: d.kind, percent: d.kind === 'percent' ? +d.percent : null, product: d.kind === 'product' ? d.product : null };
      const { data: ex } = await sb.from('offers').select('merchant_id').eq('merchant_id', a.id).maybeSingle();
      const { error } = ex ? await sb.from('offers').update(row).eq('merchant_id', a.id) : await sb.from('offers').insert({ merchant_id: a.id, ...row });
      if (error) throw error; toast('Offer saved'); return route();
    }
  } catch (err) { fail(err); } finally { btn.disabled = false; }
});

document.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-act]'); if (!b) return; A.fq = false; const { act, id } = b.dataset;
  try {
    if (act === 'pay') { b.disabled = true; const { data, error } = await sb.functions.invoke('create-checkout', { body: {} }); if (error || !data?.url) { let msg = 'Payment could not start. Please try again.'; try { msg = (await error.context.json()).error || msg; } catch (_) {} b.disabled = false; throw new Error(msg); } location.href = data.url; return; }
    if (act === 'atab') { A.modal = null; A.tab = b.dataset.v; A.q = ''; A.role = 'all'; A.status = 'all'; return route(); }
    if (act === 'theme') { flipTheme(); return route(); }
    if (act === 'madd') { A.modal = { type: b.dataset.t, x: null }; return paint(); }
    if (act === 'medit') { const x = b.dataset.t === 'listing' ? A.d.rows.find((r) => r.id === id) : A.d.off.find((o) => o.merchant_id === id); A.modal = { type: b.dataset.t, x }; return paint(); }
    if (act === 'mclose') { A.modal = null; return paint(); }
    if (act === 'plan') { const v = prompt('New price in KD', Number(b.dataset.a).toFixed(3)); if (v === null) return; const n = parseFloat(v); if (!(n > 0)) throw new Error('Enter a price above 0'); const { error } = await sb.rpc('admin_set_plan_price', { p_code: b.dataset.c, p_amount: n }); if (error) throw error; toast('Saved'); return route(); }
    if (act === 'uedit') { const name = prompt('Full name', b.dataset.name); if (name === null) return; const phone = prompt('Phone number', b.dataset.phone || ''); if (phone === null) return; const { error } = await sb.rpc('admin_update_profile', { target: id, p_name: name, p_phone: phone }); if (error) throw error; toast('Saved'); return route(); }
    if (act === 'urole') { const r = (prompt('New role: student, parent, employer, merchant or admin') || '').trim().toLowerCase(); if (!r) return; if (!['student', 'parent', 'employer', 'merchant', 'admin'].includes(r)) throw new Error('That is not a valid role'); if (r === 'admin' && !confirm('Make this person an admin? Admins can see and change everything.')) return; const { error } = await sb.rpc('admin_set_role', { target: id, new_role: r }); if (error) throw error; toast('Saved'); return route(); }
    if (act === 'aedit') { const t = prompt('Listing title', b.dataset.t); if (!t) return; const { error } = await sb.from('activities').update({ title: t }).eq('id', id); if (error) throw error; toast('Saved'); return route(); }
    if (act === 'adel') { if (!confirm('Delete this listing and its applications?')) return; const { error } = await sb.from('activities').delete().eq('id', id); if (error) throw error; toast('Deleted'); return route(); }
    if (act === 'odel') { if (!confirm('Delete this offer?')) return; const { error } = await sb.from('offers').delete().eq('merchant_id', id); if (error) throw error; toast('Deleted'); return route(); }
    if (act === 'consent') { const { error } = await sb.rpc('admin_set_consent', { app: id, approved: b.dataset.ok === '1' }); if (error) throw error; toast('Saved'); return route(); }
    if (act === 'hstat') { const { error } = await sb.rpc('admin_set_hours_status', { log_id: id, new_status: b.dataset.s }); if (error) throw error; toast('Saved'); return route(); }
    if (act === 'void') { const { error } = await sb.rpc('admin_void_redemption', { red_id: id, is_voided: b.dataset.v === '1' }); if (error) throw error; toast('Saved'); return route(); }
    if (act === 'subcancel') { const { error } = await sb.rpc('admin_cancel_subscription', { target: id }); if (error) throw error; toast('Saved'); return route(); }
    if (act === 'setting') { const { error } = await sb.rpc('admin_set_setting', { p_key: 'require_subscription', p_value: b.dataset.v }); if (error) throw error; toast('Saved'); return route(); }
    if (act === 'grant') {
      const email = (prompt('Email of the account to give a plan') || '').trim(); if (!email) return;
      const { data: u } = await sb.from('profiles').select('id,role').ilike('email', email).maybeSingle(); if (!u) throw new Error('No account with that email');
      const plan = u.role === 'student' ? 'student_monthly' : u.role === 'employer' ? 'employer_yearly' : null; if (!plan) throw new Error('Only students and employers have a plan');
      const until = new Date(); if (plan === 'student_monthly') until.setMonth(until.getMonth() + 1); else until.setFullYear(until.getFullYear() + 1);
      const { error } = await sb.rpc('admin_grant_subscription', { target: u.id, p_plan: plan, until: until.toISOString() }); if (error) throw error; toast('Plan granted'); return route();
    }
    if (act === 'stab') { ST.tab = b.dataset.v; ST.cert = null; return route(); }
    if (act === 'cert') { ST.cert = id; return route(); }
    if (act === 'certback') { ST.cert = null; return route(); }
    if (act === 'print') { window.print(); return; }
    if (act === 'redeem') { const { data, error } = await sb.rpc('redeem_reward', { p_merchant: id }); if (error) throw error; toast('Coupon ready. Your code is ' + data); return route(); }
    if (act === 'hours') { HM = id; return route(); }
    if (act === 'hclose') { HM = null; return route(); }
    if (act === 'out') { await sb.auth.signOut(); return go('#/'); }
    if (act === 'apply') { const why = prompt('Why do you want this activity?'); if (!why) return; const a = await access(); const { data: age } = await sb.rpc('student_age', { uid: a.id });
      const { error } = await sb.from('applications').insert({ activity_id: id, student_id: a.id, answers: { why }, parent_consent: age >= 18 }); if (error) throw new Error(error.code === '42501' || /row-level security/i.test(error.message) ? 'You need an active subscription (and a linked parent if you are under 18) to apply.' : error.message); return toast('Application sent'); }
    if (act === 'pdecide') { const { error } = await sb.rpc('parent_decide', { app: id, approve: b.dataset.ok === '1' }); if (error) throw error; toast('Saved'); return route(); }
    if (act === 'decide') { const { error } = await sb.rpc('employer_decide', { app: id, new_decision: b.dataset.d }); if (error) throw error; toast('Saved'); return route(); }
    if (act === 'status') { const { error } = await sb.rpc('admin_set_status', { target: id, new_status: b.dataset.s }); if (error) throw error; toast('Saved'); return route(); }
    if (act === 'idreview') { const { error } = await sb.rpc('admin_review_id', { target: id, approve: b.dataset.ok === '1' }); if (error) throw error; toast('Saved'); return route(); }
    if (act === 'photo') { const { data, error } = await sb.storage.from('civil-ids').createSignedUrl(b.dataset.p, 120); if (error) throw error; window.open(data.signedUrl, '_blank', 'noopener'); }
  } catch (err) { fail(err); }
});

document.addEventListener('input', (e) => { if (e.target.matches('[data-aq]')) { A.q = e.target.value; A.fq = true; paint(); } });
document.addEventListener('change', (e) => { const f = e.target.dataset.af; if (f) { A[f] = e.target.value; paint(); } });
sb.auth.onAuthStateChange((ev) => { if (ev === 'SIGNED_OUT') route(); });
window.addEventListener('hashchange', route);
route();
