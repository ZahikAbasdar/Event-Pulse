const { v4: uuidv4 } = require('uuid');
const XLSX = require('xlsx');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Form = require('../models/Form');
const Response = require('../models/Response');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const { ApiError } = require('../middleware/errorHandler');
const asyncHandler = require('../middleware/asyncHandler');
const { getIO } = require('../utils/socket');
const eventFeedbackQuestions = require('../utils/eventFeedbackQuestions');
const objectStorage = require('../utils/objectStorage');
const getPublicBaseUrl = require('../utils/publicUrl');

const VOICE_FEEDBACK_DIR = path.resolve(__dirname, '..', process.env.VOICE_FEEDBACK_DIR || 'private/feedback-audio');
const VOICE_FEEDBACK_BUCKET = process.env.SUPABASE_VOICE_BUCKET || 'eventpulse-voice';
const ACADEMIC_QUESTIONS = [
  { text: 'Name', type: 'academic_identifier', academicField: 'name', required: true },
  { text: 'Roll Number', type: 'academic_identifier', academicField: 'rollNumber', required: true },
  { text: 'Branch', type: 'academic_identifier', academicField: 'branch', required: true },
  { text: 'Section', type: 'academic_identifier', academicField: 'section', required: true },
  { text: 'Block (ET/MT/T Pharmacy/HM)', type: 'academic_identifier', academicField: 'block', required: true },
];

function withAcademicQuestions(questions, requiresAcademicId) {
  if (!requiresAcademicId) return questions;
  return [...ACADEMIC_QUESTIONS, ...questions];
}

// @route GET /api/forms  (organizer) — list every form across their events
exports.listMyForms = asyncHandler(async (req, res) => {
  const forms = await Form.find({ organization: req.user.organization }).populate('event', 'title slug').sort('-createdAt');
  const withCounts = await Promise.all(
    forms.map(async (f) => ({
      ...f.toObject(),
      responseCount: await Response.countDocuments({ form: f._id }),
    }))
  );
  res.json({ success: true, forms: withCounts });
});

exports.ensureEventFeedbackForms = asyncHandler(async (req, res) => {
  const filter = { organization: req.user.organization };
  if (!['super_admin', 'org_admin'].includes(req.user.role)) filter.managers = req.user._id;
  const events = await Event.find(filter).sort('title');
  const eventIds = events.map((event) => event._id);
  const forms = await Form.find({ organization: req.user.organization, event: { $in: eventIds }, eventFeedback: true });
  const formByEvent = new Map(forms.map((form) => [form.event.toString(), form]));

  for (const event of events) {
    if (formByEvent.has(event._id.toString())) continue;
    const form = await Form.create({
      organization: req.user.organization,
      event: event._id,
      title: `${event.title} — Event Feedback`,
      description: `Share your experience at ${event.title}. This form has ten event-specific questions and does not require an account.`,
      questions: eventFeedbackQuestions(event),
      shareSlug: uuidv4().slice(0, 12),
      createdBy: req.user._id,
      isPublic: true,
      isActive: true,
      eventFeedback: true,
      requiresAcademicId: false,
    });
    formByEvent.set(event._id.toString(), form);
  }

  const links = await Promise.all(events.map(async (event) => {
    const form = formByEvent.get(event._id.toString());
    const shareUrl = `${getPublicBaseUrl(req)}/feedback/${form.shareSlug}`;
    const qrCodeDataUrl = await QRCode.toDataURL(shareUrl, { errorCorrectionLevel: 'H', margin: 2, width: 320 });
    return {
      event: { _id: event._id, title: event.title, slug: event.slug },
      form: { _id: form._id, title: form.title, shareSlug: form.shareSlug, questions: form.questions },
      shareUrl,
      qrCodeDataUrl,
      responseCount: await Response.countDocuments({ form: form._id }),
    };
  }));

  res.json({ success: true, links });
});

// @route POST /api/forms  (organizer builds a form manually)
exports.createForm = asyncHandler(async (req, res) => {
  const { event, title, description, questions, requiresAcademicId = true } = req.body;
  const ev = await Event.findOne({ _id: event, organization: req.user.organization });
  if (!ev) throw new ApiError(404, 'Event not found');

  const form = await Form.create({
    organization: req.user.organization,
    event: ev._id,
    title,
    description,
    questions: withAcademicQuestions(questions || [], requiresAcademicId),
    requiresAcademicId,
    shareSlug: uuidv4().slice(0, 8),
    createdBy: req.user._id,
  });
  res.status(201).json({ success: true, form });
});

// @route POST /api/forms/ai-generate
// AI-assisted builder: organizer describes the event, gets a ready 10-question form.
// Uses an external AI provider if AI_PROVIDER_API_KEY is configured; otherwise falls
// back to a solid deterministic template so the feature always works out of the box.
exports.aiGenerateForm = asyncHandler(async (req, res) => {
  const { event, eventDescription } = req.body;
  const ev = await Event.findOne({ _id: event, organization: req.user.organization });
  if (!ev) throw new ApiError(404, 'Event not found');

  let questions = buildTemplateQuestions(eventDescription || ev.description || ev.title);

  if (process.env.AI_PROVIDER_API_KEY) {
    try {
      questions = await callAIForQuestions(eventDescription || ev.description || ev.title);
    } catch (err) {
      console.error('[ai-form] AI provider call failed, using template fallback:', err.message);
    }
  }

  const form = await Form.create({
    organization: req.user.organization,
    event: ev._id,
    title: `${ev.title} — Feedback`,
    description: `Auto-generated feedback form for ${ev.title}`,
    questions: withAcademicQuestions(questions, true),
    requiresAcademicId: true,
    shareSlug: uuidv4().slice(0, 8),
    createdBy: req.user._id,
    aiGenerated: true,
  });
  res.status(201).json({ success: true, form });
});

function buildTemplateQuestions(context) {
  return [
    { text: 'How would you rate the overall event experience?', type: 'rating', required: true },
    { text: 'How would you rate the event organization and logistics?', type: 'rating', required: true },
    { text: 'How would you rate the venue and facilities?', type: 'rating', required: true },
    { text: 'How relevant was the content/activities to your interests?', type: 'rating', required: true },
    { text: 'How would you rate the speakers/performers/judges?', type: 'rating', required: false },
    { text: 'What did you enjoy most about the event?', type: 'open_text', required: false },
    { text: 'What could be improved for next time?', type: 'open_text', required: false },
    { text: 'Would you attend a similar event again?', type: 'choice', options: ['Definitely', 'Probably', 'Not sure', 'Probably not', 'Definitely not'], required: true },
    { text: 'How did you hear about this event?', type: 'choice', options: ['Class group', 'Poster/QR code', 'Friend', 'Social media', 'Faculty announcement', 'Other'], required: false },
    { text: 'On a scale of 0-10, how likely are you to recommend this event to a classmate?', type: 'nps', required: true },
  ];
}

async function callAIForQuestions(context) {
  const resp = await fetch(`${process.env.AI_PROVIDER_BASE_URL || 'https://api.anthropic.com'}/v1/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.AI_PROVIDER_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      messages: [
        {
          role: 'user',
          content: `Generate exactly 10 feedback form questions for this event: "${context}". Return ONLY a JSON array, no prose, each item shaped like {"text": "...", "type": "rating|choice|open_text|nps", "options": ["..."] (only for choice), "required": true|false}.`,
        },
      ],
    }),
  });
  const data = await resp.json();
  const text = (data.content || []).map((c) => c.text || '').join('');
  const clean = text.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(clean);
  if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('AI returned no usable questions');
  return parsed;
}

// @route GET /api/forms/share/:shareSlug  (public, no login)
exports.getPublicForm = asyncHandler(async (req, res) => {
  const form = await Form.findOne({ shareSlug: req.params.shareSlug, isActive: true }).populate('event', 'title slug');
  if (!form) throw new ApiError(404, 'This feedback form is not available.');
  res.json({ success: true, form });
});

// @route POST /api/forms/share/:shareSlug/responses  (public, no login)
exports.submitPublicResponse = asyncHandler(async (req, res) => {
  const form = await Form.findOne({ shareSlug: req.params.shareSlug, isActive: true });
  if (!form) throw new ApiError(404, 'This feedback form is not available.');

  let { answers, academicInfo, ticketCode } = req.body;
  try {
    if (typeof answers === 'string') answers = JSON.parse(answers);
    if (typeof academicInfo === 'string') academicInfo = JSON.parse(academicInfo);
  } catch (_err) {
    throw new ApiError(400, 'Feedback answers or participant details were not valid JSON.');
  }
  if (!Array.isArray(answers)) throw new ApiError(400, 'answers are required.');

  if (form.eventFeedback) {
    if (!academicInfo || typeof academicInfo !== 'object' || Array.isArray(academicInfo)) {
      throw new ApiError(400, 'Participant details are required.');
    }
    const required = ['name', 'rollNumber', 'className', 'batch', 'block', 'phone', 'email'];
    const missing = required.filter((field) => !String(academicInfo?.[field] || '').trim());
    if (missing.length) throw new ApiError(400, `Complete these participant details: ${missing.join(', ')}.`);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(academicInfo.email)) throw new ApiError(400, 'Enter a valid email address.');
    if (!/^\+[1-9]\d{7,14}$/.test(academicInfo.phone)) throw new ApiError(400, 'Enter a phone number with its international country code.');
    if (!['ET', 'MT', 'T Pharmacy', 'HM'].includes(academicInfo.block)) throw new ApiError(400, 'Choose a valid campus block.');
    if (form.questions.length !== 10 || answers.length !== form.questions.length) {
      throw new ApiError(400, 'This event feedback form must contain and receive exactly ten answers.');
    }
    const submittedIds = answers.map((answer) => answer?.question);
    const expectedIds = form.questions.map((question) => question._id.toString());
    if (new Set(submittedIds).size !== expectedIds.length || expectedIds.some((id) => !submittedIds.includes(id))) {
      throw new ApiError(400, 'Each event feedback question must be answered exactly once.');
    }
  }

  if (form.requiresAcademicId) {
    const required = ['name', 'rollNumber', 'branch', 'section', 'block'];
    const missing = required.filter((f) => !academicInfo?.[f]);
    if (missing.length) throw new ApiError(400, `Missing required fields: ${missing.join(', ')}`);
  }

  const normalizedAnswers = form.eventFeedback
    ? form.questions.map((question) => {
      const answer = answers.find((item) => item.question === question._id.toString());
      const value = answer?.value ?? '';
      if (question.required && (value === '' || value === null || value === undefined)) {
        throw new ApiError(400, `Please answer: ${question.text}`);
      }
      if (question.type === 'rating' && value !== '' && (!Number.isInteger(Number(value)) || Number(value) < 1 || Number(value) > 5)) {
        throw new ApiError(400, `Choose a rating from 1 to 5 for: ${question.text}`);
      }
      if (question.type === 'nps' && value !== '' && (!Number.isInteger(Number(value)) || Number(value) < 0 || Number(value) > 10)) {
        throw new ApiError(400, `Choose an NPS score from 0 to 10 for: ${question.text}`);
      }
      if (question.type === 'choice' && value !== '' && !question.options.includes(value)) {
        throw new ApiError(400, `Choose one of the listed options for: ${question.text}`);
      }
      if (question.type === 'open_text' && (typeof value !== 'string' || value.length > 4000)) {
        throw new ApiError(400, `Text feedback must be at most 4,000 characters for: ${question.text}`);
      }
      return { question: question._id, questionText: question.text, value };
    })
    : answers.map((answer) => {
      const question = form.questions.id(answer.question);
      if (!question) throw new ApiError(400, 'A submitted answer does not belong to this feedback form.');
      return { question: question._id, questionText: question.text, value: answer.value };
    });

  let voiceFeedback = undefined;
  if (req.file) {
    await fs.promises.mkdir(VOICE_FEEDBACK_DIR, { recursive: true });
    const mimeType = req.file.mimetype.split(';')[0].toLowerCase();
    const extensionByMimeType = {
      'audio/webm': '.webm',
      'audio/ogg': '.ogg',
      'audio/mp4': '.m4a',
      'audio/mpeg': '.mp3',
      'audio/wav': '.wav',
      'audio/x-wav': '.wav',
    };
    const extension = extensionByMimeType[mimeType];
    if (!extension) throw new ApiError(400, 'Unsupported voice recording format.');
    const fileName = `${crypto.randomUUID()}${extension}`;
    if (objectStorage.isConfigured()) {
      await objectStorage.uploadObject({
        bucket: VOICE_FEEDBACK_BUCKET,
        objectPath: fileName,
        body: req.file.buffer,
        contentType: mimeType,
      });
    } else {
      await fs.promises.mkdir(VOICE_FEEDBACK_DIR, { recursive: true });
      await fs.promises.writeFile(path.join(VOICE_FEEDBACK_DIR, fileName), req.file.buffer, { flag: 'wx' });
    }
    voiceFeedback = {
      fileName,
      mimeType,
      originalName: path.basename(req.file.originalname).slice(0, 120),
      sizeBytes: req.file.size,
    };
  }

  const npsAnswer = normalizedAnswers.find((answer) => form.questions.id(answer.question)?.type === 'nps');

  const response = await Response.create({
    organization: form.organization,
    form: form._id,
    event: form.event,
    respondentUser: req.user?._id || null,
    academicInfo,
    answers: normalizedAnswers,
    voiceFeedback,
    npsScore: npsAnswer && npsAnswer.value !== '' ? Number(npsAnswer.value) : null,
    sentiment: tagSentiment(normalizedAnswers),
  });

  // If this response came from scanning a ticket's feedback QR, mark that
  // ticket as having given feedback — visible on the participant's ticket
  // and usable for organizer completion-rate reporting.
  if (ticketCode) {
    await Ticket.findOneAndUpdate({ code: ticketCode, event: form.event }, { feedbackSubmitted: true });
  }

  // Live-update the organizer dashboard's sentiment/NPS chart the moment
  // feedback comes in — same "no refresh needed" pattern as registrations.
  getIO()?.to(`event:${form.event}`).emit('feedback:new', {
    eventId: form.event,
    formId: form._id,
    responseId: response._id,
    sentiment: response.sentiment,
    npsScore: response.npsScore,
    hasVoiceFeedback: Boolean(response.voiceFeedback?.fileName),
    submittedAt: response.submittedAt,
  });

  res.status(201).json({ success: true, message: 'Thank you for your feedback!', responseId: response._id });
});

// Lightweight rule-based sentiment tagger over open-text answers — no external
// dependency required, keeps the "automatic sentiment tagging" feature working
// out of the box. Swap in a model-based classifier later if desired.
function tagSentiment(answers) {
  const openText = answers
    .map((a) => (typeof a.value === 'string' ? a.value : ''))
    .join(' ')
    .toLowerCase();
  if (!openText.trim()) return null;

  const positiveWords = ['great', 'excellent', 'amazing', 'good', 'love', 'awesome', 'fantastic', 'enjoyed', 'best', 'wonderful'];
  const negativeWords = ['bad', 'poor', 'worst', 'terrible', 'disappointing', 'hate', 'boring', 'awful', 'waste', 'delay', 'late'];

  let score = 0;
  positiveWords.forEach((w) => { if (openText.includes(w)) score += 1; });
  negativeWords.forEach((w) => { if (openText.includes(w)) score -= 1; });

  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}

async function findOrganizerForm(formId, user) {
  const form = await Form.findOne({ _id: formId, organization: user.organization });
  if (!form) return null;
  if (!['super_admin', 'org_admin'].includes(user.role)) {
    const managedEvent = await Event.exists({ _id: form.event, managers: user._id });
    if (!managedEvent) return null;
  }
  return form;
}

// @route GET /api/forms/:id/responses  (organizer)
exports.listResponses = asyncHandler(async (req, res) => {
  const form = await findOrganizerForm(req.params.id, req.user);
  if (!form) throw new ApiError(404, 'Form not found');
  const responses = await Response.find({ form: form._id }).sort('-createdAt');
  res.json({ success: true, form, responses });
});

exports.getVoiceFeedback = asyncHandler(async (req, res) => {
  const form = await findOrganizerForm(req.params.id, req.user);
  if (!form) throw new ApiError(404, 'Form not found.');
  const response = await Response.findOne({ _id: req.params.responseId, form: form._id }).select('voiceFeedback');
  if (!response?.voiceFeedback?.fileName) throw new ApiError(404, 'This response has no voice recording.');
  if (!/^[\da-f-]{36}\.(webm|ogg|m4a|mp3|wav)$/i.test(response.voiceFeedback.fileName)) {
    throw new ApiError(500, 'Stored voice recording reference is invalid.');
  }

  res.set({
    'Content-Type': response.voiceFeedback.mimeType,
    'Content-Disposition': `inline; filename="${response.voiceFeedback.fileName}"`,
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  if (objectStorage.isConfigured()) {
    try {
      const audio = await objectStorage.downloadObject({
        bucket: VOICE_FEEDBACK_BUCKET,
        objectPath: response.voiceFeedback.fileName,
      });
      return res.send(audio);
    } catch (err) {
      console.error('[feedback] Stored voice recording is unavailable:', err.message);
      throw new ApiError(500, 'The stored voice recording is currently unavailable.');
    }
  }

  const filePath = path.join(VOICE_FEEDBACK_DIR, response.voiceFeedback.fileName);
  try {
    await fs.promises.access(filePath, fs.constants.R_OK);
  } catch (err) {
    console.error('[feedback] Stored voice recording is unavailable:', err.message);
    throw new ApiError(500, 'The stored voice recording is currently unavailable.');
  }
  fs.createReadStream(filePath).on('error', (err) => {
    console.error('[feedback] Could not stream stored voice recording:', err.message);
    if (res.headersSent) res.destroy(err);
    else res.status(500).json({ success: false, message: 'Could not read the stored voice recording.' });
  }).pipe(res);
});

// @route GET /api/forms/:id/responses/export?format=xlsx|csv|json
exports.exportResponsesExcel = asyncHandler(async (req, res) => {
  const form = await findOrganizerForm(req.params.id, req.user);
  if (!form) throw new ApiError(404, 'Form not found');
  const responses = await Response.find({ form: form._id }).sort('-createdAt');
  const format = String(req.query.format || 'xlsx').toLowerCase();
  if (!['xlsx', 'csv', 'json'].includes(format)) {
    throw new ApiError(400, 'Choose an export format: xlsx, csv, or json.');
  }

  const answerQuestions = form.questions.filter((q) => q.type !== 'academic_identifier');
  const rows = responses.map((r) => {
    const row = {
      Name: r.academicInfo?.name || '',
      'Roll Number': r.academicInfo?.rollNumber || '',
      Class: r.academicInfo?.className || '',
      Batch: r.academicInfo?.batch || '',
      Branch: r.academicInfo?.branch || '',
      Section: r.academicInfo?.section || '',
      Block: r.academicInfo?.block || '',
      Phone: r.academicInfo?.phone || '',
      Email: r.academicInfo?.email || '',
      'Voice Recording': r.voiceFeedback?.fileName ? 'Stored' : 'Not provided',
      Sentiment: r.sentiment || '',
      'Submitted At': new Date(r.submittedAt).toLocaleString(),
    };
    answerQuestions.forEach((q) => {
      const a = r.answers.find((ans) => ans.question.toString() === q._id.toString());
      row[q.text] = a ? a.value : '';
    });
    return row;
  });

  const filename = `${form.title.replace(/[^a-z0-9]+/gi, '-')}-responses`;
  if (format === 'json') {
    res.set({
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}.json"`,
    });
    return res.send(JSON.stringify(rows, null, 2));
  }
  if (format === 'csv') {
    const baseColumns = [
      'Name',
      'Roll Number',
      'Class',
      'Batch',
      'Branch',
      'Section',
      'Block',
      'Phone',
      'Email',
      'Voice Recording',
      'Sentiment',
      'Submitted At',
    ];
    const columns = [...new Set([...baseColumns, ...answerQuestions.map((question) => question.text)])];
    const csvCell = (value) => {
      const text = value === null || value === undefined ? '' : String(value);
      const safeText = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
      return `"${safeText.replace(/"/g, '""')}"`;
    };
    const csv = [
      columns.map(csvCell).join(','),
      ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(',')),
    ].join('\r\n');
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}.csv"`,
    });
    return res.send(`\uFEFF${csv}`);
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Responses');
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  res.set({
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
  });
  return res.send(buffer);
});

// @route GET /api/forms/:id/analytics — NPS breakdown, sentiment counts, word cloud data
exports.formAnalytics = asyncHandler(async (req, res) => {
  const form = await findOrganizerForm(req.params.id, req.user);
  if (!form) throw new ApiError(404, 'Form not found');
  const responses = await Response.find({ form: form._id });

  const npsScores = responses.map((r) => r.npsScore).filter((n) => n !== null && n !== undefined);
  const promoters = npsScores.filter((s) => s >= 9).length;
  const passives = npsScores.filter((s) => s >= 7 && s <= 8).length;
  const detractors = npsScores.filter((s) => s <= 6).length;
  const npsScore = npsScores.length ? Math.round(((promoters - detractors) / npsScores.length) * 100) : null;

  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
  responses.forEach((r) => { if (r.sentiment) sentimentCounts[r.sentiment] += 1; });

  // Word cloud: naive word-frequency count over all open-text answers
  const wordFreq = {};
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'is', 'was', 'were', 'to', 'of', 'in', 'it', 'for', 'on', 'with', 'this', 'that', 'i', 'we']);
  responses.forEach((r) => {
    r.answers.forEach((a) => {
      if (typeof a.value === 'string' && a.value.length > 2) {
        a.value.toLowerCase().split(/\W+/).forEach((w) => {
          if (w && !stopWords.has(w) && w.length > 2) wordFreq[w] = (wordFreq[w] || 0) + 1;
        });
      }
    });
  });
  const wordCloud = Object.entries(wordFreq).sort((a, b) => b[1] - a[1]).slice(0, 40).map(([text, value]) => ({ text, value }));

  res.json({
    success: true,
    totalResponses: responses.length,
    nps: { score: npsScore, promoters, passives, detractors, totalRated: npsScores.length },
    sentiment: sentimentCounts,
    wordCloud,
  });
});
