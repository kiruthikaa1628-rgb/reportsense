import { ensureSchema, getPool, getUser, sendError } from './_lib.js';

export const config = { maxDuration: 60 };

const LANGUAGES = [
  'English', 'Hindi', 'Tamil', 'Telugu', 'Bengali',
  'Marathi', 'Kannada', 'Malayalam', 'Gujarati', 'Punjabi',
];
const MIME_OK = ['image/jpeg', 'image/png', 'image/webp'];
const STATUSES = ['low', 'normal', 'high', 'unclear', 'abnormal', 'present', 'absent'];
const MAX_BASE64_CHARS = 3_500_000; // ~2.6 MB of image data; the browser compresses to ~1 MB

// Report types the AI can identify
const REPORT_TYPES = [
  'blood_test', 'urine_test', 'xray', 'mri', 'ct_scan', 'ecg',
  'ultrasound', 'pathology', 'prescription', 'discharge_summary',
  'other_lab', 'other_medical', 'not_medical',
];

function buildPrompt(language) {
  return `You are a careful medical report assistant that explains all types of hospital and laboratory reports to ordinary people in simple, calm language.

The attached image may be ANY type of hospital or medical report, including but not limited to:
- Blood test / haematology report
- Urine / stool analysis report
- X-ray, MRI, CT scan, or ultrasound report (radiology)
- ECG / EEG report
- Pathology / biopsy report
- Discharge summary
- Prescription or doctor's note
- Any other laboratory or clinical report

Write ALL human-readable text (summary, findings, and explanations) in ${language}.
Keep item names exactly as printed on the report (you may add a short ${language} translation in brackets).

Return ONLY valid JSON with this exact shape:
{
  "is_medical_report": true or false,
  "report_type": one of ["blood_test","urine_test","xray","mri","ct_scan","ecg","ultrasound","pathology","prescription","discharge_summary","other_lab","other_medical","not_medical"],
  "report_type_label": "Human-readable report type name in ${language}",
  "summary": "2-5 simple sentences describing the overall picture or key findings. No diagnosis.",
  "results": [
    {
      "test_name": "name / finding as printed on the report",
      "value": "the value, finding, or impression exactly as printed, or empty string if unreadable",
      "reference_range": "the normal range or expected finding printed on the report, or 'not shown on report'",
      "status": "low" | "normal" | "high" | "abnormal" | "present" | "absent" | "unclear",
      "far_outside_range": true or false,
      "explanation": "1-3 simple sentences: what this test or finding means and what the result generally indicates in everyday terms"
    }
  ]
}

NOTES BY REPORT TYPE:
- For radiology/imaging (X-ray, MRI, CT, ultrasound): each "result" is a key finding or impression from the report. Use "value" for the finding text, "reference_range" as "normal appearance", and "status" as "normal" or "abnormal" or "unclear".
- For ECG: each result is a measured parameter (e.g. Heart Rate, PR Interval, QRS Duration, Rhythm). Use "status" as "normal" or "abnormal".
- For prescriptions: list each medicine as a result. Use "value" for dose/frequency, "reference_range" as "not shown on report", "status" as "unclear", and "explanation" to describe what the medicine is generally used for (never advise to take or stop it).
- For discharge summaries: list key clinical events and instructions as results.
- For urine/stool: use the same structure as blood tests.

STRICT SAFETY RULES:
- NEVER diagnose. NEVER say the person has or probably has a disease or condition.
- NEVER recommend medicines, supplements, doses or treatments.
- Do not guess a cause. You may say a finding can have many causes and that a doctor should interpret it.
- Decide status ONLY by comparing to the reference range or expected normal printed on the report. If no range is shown or it is unreadable, status must be "unclear".
- "far_outside_range" is true only when the value is clearly and substantially outside the printed range (for qualitative/imaging findings, set it to false unless explicitly marked critical on the report).
- Never invent values or findings not visible in the image. If you cannot read something, use "unclear".
- If the image is not any kind of medical or hospital report, set "is_medical_report" to false, "report_type" to "not_medical", "results" to [], and explain briefly in "summary".
- Use simple, calm, non-alarming words.`;
}

function extractJson(text) {
  const cleaned = text.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error('bad json');
  }
}

function clean(parsed) {
  const results = (Array.isArray(parsed.results) ? parsed.results : []).slice(0, 100).map((r) => ({
    test_name: String(r.test_name || '').slice(0, 120),
    value: String(r.value || '').slice(0, 200),
    reference_range: String(r.reference_range || 'not shown on report').slice(0, 120),
    status: STATUSES.includes(String(r.status).toLowerCase()) ? String(r.status).toLowerCase() : 'unclear',
    far_outside_range: r.far_outside_range === true,
    explanation: String(r.explanation || '').slice(0, 800),
  }));
  const reportType = REPORT_TYPES.includes(parsed.report_type) ? parsed.report_type : 'other_medical';
  return {
    is_medical_report: parsed.is_medical_report !== false,
    report_type: reportType,
    report_type_label: String(parsed.report_type_label || reportType).slice(0, 80),
    summary: String(parsed.summary || '').slice(0, 1500),
    results,
    urgent: results.some((r) => r.far_outside_range),
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendError(res, 405, 'Use POST.');

  try {
    const user = await getUser(req);
    if (!user) return sendError(res, 401, 'Please sign in again.');

    const { image, mimeType, language } = req.body || {};
    if (!image || typeof image !== 'string') return sendError(res, 400, 'No image received.');
    if (!MIME_OK.includes(mimeType)) return sendError(res, 400, 'Please upload a JPG, PNG or WebP image.');
    if (!LANGUAGES.includes(language)) return sendError(res, 400, 'Unsupported language.');
    if (image.length > MAX_BASE64_CHARS) return sendError(res, 413, 'Image is too large. Try a smaller photo.');

    if (!process.env.GEMINI_API_KEY) return sendError(res, 500, 'Server is missing GEMINI_API_KEY.');

    // Fallback list of models in case of Google server spikes or high demand
    const candidateModels = Array.from(
      new Set(
        [
          process.env.GEMINI_MODEL,
          'gemini-3.5-flash',
          'gemini-3.5-flash-lite',
          'gemini-3.6-flash',
          'gemini-3.8-flash',
        ].filter(Boolean)
      )
    );

    let gemRes = null;
    for (const m of candidateModels) {
      try {
        const attempt = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': process.env.GEMINI_API_KEY,
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: buildPrompt(language) },
                    { inline_data: { mime_type: mimeType, data: image } },
                  ],
                },
              ],
              generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
            }),
          }
        );

        if (attempt.ok) {
          gemRes = attempt;
          break;
        }

        const detail = await attempt.text();
        console.warn(`Gemini model ${m} returned ${attempt.status}:`, detail.slice(0, 200));

        // If 503 (high demand) or 404 (model deprecated), try next model in the list
        if (attempt.status === 503 || attempt.status === 404) {
          continue;
        }

        gemRes = attempt;
        break;
      } catch (fetchErr) {
        console.warn(`Connection error to model ${m}:`, fetchErr.message);
      }
    }

    if (!gemRes || !gemRes.ok) {
      if (gemRes?.status === 429) {
        return sendError(res, 429, 'The free AI limit has been reached for now. Please try again in a few minutes.');
      }
      return sendError(res, 502, 'The AI service could not read this report. Please try again.');
    }

    const gemJson = await gemRes.json();
    const text = gemJson?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
    if (!text) return sendError(res, 502, 'The AI returned no answer. Try a clearer photo.');

    let parsed;
    try {
      parsed = clean(extractJson(text));
    } catch {
      return sendError(res, 502, 'Could not understand the AI answer. Please try again.');
    }

    if (!parsed.is_medical_report || parsed.results.length === 0) {
      return sendError(res, 422, parsed.summary || 'This does not look like a readable medical report. Try a clearer, well-lit photo of your report.');
    }

    await ensureSchema();
    const pool = getPool();

    try {
      await pool.query(
        `insert into public.profiles (id, email, phone, updated_at)
         values ($1, $2, $3, now())
         on conflict (id) do update set
           email = coalesce(excluded.email, public.profiles.email),
           phone = coalesce(excluded.phone, public.profiles.phone),
           updated_at = now()`,
        [user.id, user.email || null, user.phone || null]
      );
    } catch (profileErr) {
      console.warn('Profile sync warning:', profileErr.message);
    }

    const { rows } = await pool.query(
      `insert into public.reports (user_id, language, summary, results, urgent, report_type, report_type_label)
       values ($1, $2, $3, $4::jsonb, $5, $6, $7)
       returning id, created_at`,
      [
        user.id,
        language,
        parsed.summary,
        JSON.stringify(parsed.results),
        parsed.urgent,
        parsed.report_type,
        parsed.report_type_label,
      ]
    );

    return res.status(200).json({
      id: rows[0].id,
      created_at: rows[0].created_at,
      language,
      report_type: parsed.report_type,
      report_type_label: parsed.report_type_label,
      summary: parsed.summary,
      results: parsed.results,
      urgent: parsed.urgent,
    });
  } catch (err) {
    console.error(err);
    return sendError(res, 500, 'Something went wrong on the server. Please try again.');
  }
}
