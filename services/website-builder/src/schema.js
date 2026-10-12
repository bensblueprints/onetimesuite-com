import { z } from 'zod';

const text = z.string().trim().min(1).max(4000);
const tz = z.string().max(80).refine(v => { try { new Intl.DateTimeFormat('en', { timeZone: v }); return true; } catch { return false; } }, 'Use an IANA timezone');
export const briefSchema = z.object({
  lead_id: z.string().trim().max(160).optional(),
  business_name: z.string().trim().min(2).max(200),
  website_url: z.url().max(2000).refine(v => /^https?:\/\//i.test(v), 'Use an HTTP or HTTPS website'),
  website_platform: z.string().max(100).optional(),
  contact_name: z.string().trim().min(1).max(200),
  email: z.email().max(254),
  phone: z.string().max(80).optional(),
  dislikes: text,
  requested_features: z.array(text).max(20).default([]),
  current_lead_sources: z.string().max(4000).default('Not discussed'),
  prospect_timezone: tz,
  consent_to_build: z.literal(true),
  appointment: z.object({
    event_id: z.string().min(1).max(300),
    start_at: z.iso.datetime({ offset: true }),
    end_at: z.iso.datetime({ offset: true }),
    attendance_confirmed: z.literal(true),
    invitation_received: z.boolean(),
    join_url: z.url().max(2000).optional(),
  }).optional(),
}).strict();

export function validateBrief(input, { requireAppointment = true, now = Date.now() } = {}) {
  const b = briefSchema.parse(input);
  const u = new URL(b.website_url);
  if (u.username || u.password || !['', '80', '443'].includes(u.port)) throw new Error('Website URL must not contain credentials or a custom port');
  u.hash = ''; b.website_url = u.href;
  if (requireAppointment && !b.appointment) throw new Error('Book and confirm the presentation before starting the build');
  if (b.appointment) {
    const start = Date.parse(b.appointment.start_at), end = Date.parse(b.appointment.end_at);
    if (start < now + 24 * 3600000 || start > now + 48 * 3600000) throw new Error('Presentation must be 24–48 hours from now');
    if (end <= start || end - start > 3 * 3600000) throw new Error('Invalid presentation duration');
    if (b.appointment.join_url && new URL(b.appointment.join_url).protocol !== 'https:') throw new Error('Meeting links must use HTTPS');
  }
  return b;
}

export const siteSchema = z.object({
  business_name: z.string().min(2).max(200),
  tagline: z.string().min(5).max(150),
  description: z.string().min(20).max(400),
  hero_title: z.string().min(5).max(120),
  hero_copy: z.string().min(30).max(650),
  about: z.string().min(40).max(2000),
  theme: z.enum(['forest', 'navy', 'terracotta']),
  services: z.array(z.object({ title: z.string().min(2).max(100), description: z.string().min(20).max(650) })).min(1).max(8),
  faqs: z.array(z.object({ question: z.string().min(5).max(200), answer: z.string().min(10).max(800) })).min(2).max(8),
  improvements: z.array(z.string().min(5).max(500)).min(2).max(12),
  needs_review: z.array(z.string().max(500)).max(20),
  feature_coverage: z.array(z.object({ request: z.string().max(4000), status: z.enum(['included', 'requires_integration', 'needs_clarification']), explanation: z.string().max(800) })).max(20),
}).strict();

export const reviewSchema = z.object({
  passed: z.boolean(),
  issues: z.array(z.string().max(1000)).max(20),
  summary: z.string().min(10).max(1500),
}).strict();
