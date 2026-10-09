// Rules for the automatic Civil ID check. Pure functions, no network, easy to test.
// The reading itself (OCR) is done elsewhere; this file only decides what to do with what was read.

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
export const latinDigits = (s: string) => String(s ?? '').replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)));

export const ageOn = (dob: string, now = new Date()) => {
  const b = new Date(dob);
  let a = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) a--;
  return a;
};

const norm = (s: string) => String(s ?? '').toLowerCase().replace(/[^a-z\u0600-\u06ff\s]/g, ' ').split(/\s+/).filter(Boolean);
const lev = (a: string, b: string) => {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  }
  return d[a.length][b.length];
};
// Names are spelled in different ways in English, so allow one letter of difference per word.
export const nameMatches = (profileName: string, cardName: string) => {
  const p = norm(profileName), c = norm(cardName);
  if (!p.length || !c.length) return false;
  const hit = p.filter((t) => c.some((u) => u === t || (t.length > 3 && lev(u, t) <= 1))).length;
  return hit / p.length >= 0.6;
};

// Kuwait civil number: 12 digits. First digit = century (2 = 1900s, 3 = 2000s), digits 2 to 7 = birth date YYMMDD.
export const decodeNumber = (num: string) => {
  if (!/^\d{12}$/.test(num)) return null;
  const century = num[0] === '2' ? '19' : num[0] === '3' ? '20' : null;
  if (!century) return null;
  const dob = `${century}${num.slice(1, 3)}-${num.slice(3, 5)}-${num.slice(5, 7)}`;
  const d = new Date(dob);
  return isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== dob ? null : dob;
};
// Informational only until it is confirmed against PACI documentation. It never blocks an approval.
export const checksumOk = (num: string) => {
  if (!/^\d{12}$/.test(num)) return false;
  const w = [2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const sum = w.reduce((n, wt, i) => n + wt * Number(num[i]), 0);
  let c = 11 - (sum % 11);
  if (c === 11) c = 0;
  return c === Number(num[11]);
};

export type Decision = {
  decision: 'verified' | 'needs_review' | 'rejected';
  reason: string | null;
  checks: Record<string, boolean>;
  flags: string[];
  dob: string | null;
  expiry: string | null;
  number: string | null;
};

// x = what the reader found on the two photos. ctx = who uploaded them.
export function decide(x: any, ctx: { role: string; profileName: string; dobClaimed: string | null; now?: Date }): Decision {
  const now = ctx.now ?? new Date();
  const hard: string[] = [], flags: string[] = [], checks: Record<string, boolean> = {};
  const number = latinDigits(x?.civil_number ?? '').replace(/\D/g, '') || null;
  const dob = /^\d{4}-\d{2}-\d{2}$/.test(x?.dob ?? '') ? x.dob : null;
  const expiry = /^\d{4}-\d{2}-\d{2}$/.test(x?.expiry ?? '') ? x.expiry : null;

  const sides = [x?.side1, x?.side2];
  checks.both_sides = sides.includes('front') && sides.includes('back');
  if (!checks.both_sides) hard.push('One of the photos does not look like the front or back of a Kuwaiti Civil ID. Please upload the front in the first box and the back in the second box.');
  checks.readable = x?.readable !== false;
  if (checks.both_sides && !checks.readable) hard.push('The photos are blurry or cut off. Please retake them in good light, with all four corners and all the text visible.');

  if (hard.length === 0) {
    checks.number_present = !!number && /^\d{12}$/.test(number);
    if (!checks.number_present) flags.push('civil_number_not_read');
    checks.dob_present = !!dob;
    if (!dob) flags.push('birth_date_not_read');
    checks.expiry_present = !!expiry;
    if (!expiry) flags.push('expiry_not_read');

    if (expiry) {
      checks.not_expired = expiry >= now.toISOString().slice(0, 10);
      if (!checks.not_expired) hard.push('This ID has expired. Please upload a valid ID.');
    }
    if (dob && ctx.role === 'student' && ctx.dobClaimed) {
      checks.dob_matches_entered = dob === ctx.dobClaimed;
      if (!checks.dob_matches_entered) hard.push('The date of birth on your ID does not match the date you entered. Please check it and upload again.');
    }
    if (dob && ctx.role === 'parent') {
      checks.parent_is_adult = ageOn(dob, now) >= 18;
      if (!checks.parent_is_adult) hard.push('A parent account must belong to someone aged 18 or older.');
    }
    if (dob && ctx.role === 'student') {
      const age = ageOn(dob, now);
      checks.age_in_range = age >= 14 && age <= 22;
      if (!checks.age_in_range) flags.push('age_outside_14_to_22');
    }
    if (number && dob) {
      const fromNumber = decodeNumber(number);
      checks.number_matches_birth_date = fromNumber === dob;
      if (!checks.number_matches_birth_date) flags.push('birth_date_differs_from_civil_number');
    }
    if (number) checks.number_checksum_ok = checksumOk(number); // informational only
    if (x?.name_en) {
      checks.name_matches = nameMatches(ctx.profileName, x.name_en);
      if (!checks.name_matches) flags.push('name_differs_from_account');
    } else flags.push('name_not_read');
    if (x?.looks_like_screen_or_copy === true) { checks.original_card = false; flags.push('photo_of_a_screen_or_copy'); }
    if (x?.looks_edited === true) { checks.not_edited = false; flags.push('looks_edited'); }
    checks.confident = typeof x?.confidence === 'number' && x.confidence >= 0.8;
    if (!checks.confident) flags.push('low_confidence');
  }

  const base = { checks, flags, dob, expiry, number };
  if (hard.length) return { decision: 'rejected', reason: hard[0], ...base };
  if (flags.length) return { decision: 'needs_review', reason: 'A person will check your ID. This usually takes about a day.', ...base };
  return { decision: 'verified', reason: null, ...base };
}
