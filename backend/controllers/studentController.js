const fs = require('fs');
const { parse } = require('csv-parse/sync');
const XLSX = require('xlsx');
const User = require('../models/User');const Ticket = require('../models/Ticket');
const Response = require('../models/Response');
const Certificate = require('../models/Certificate');
const asyncHandler = require('../middleware/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');

// @route GET /api/students/:userId/profile
// Unified cross-event student profile: every event registered/attended,
// feedback given, certificates earned, plus a composite engagement score.
exports.getStudentProfile = asyncHandler(async (req, res) => {
  const student = await User.findOne({ _id: req.params.userId, organization: req.user.organization });
  if (!student) throw new ApiError(404, 'Student not found');

  const [tickets, responses, certificates] = await Promise.all([
    Ticket.find({ user: student._id }).populate('event', 'title slug startDate'),
    Response.find({ respondentUser: student._id }).populate('event', 'title slug'),
    Certificate.find({ user: student._id }).populate('event', 'title slug'),
  ]);

  const attended = tickets.filter((t) => t.status === 'checked_in').length;
  // Composite engagement score: registrations worth 1pt, attendance 3pts,
  // feedback given 2pts, certificates earned 2pts — simple, transparent, tunable.
  const engagementScore =
    tickets.length * 1 + attended * 3 + responses.length * 2 + certificates.length * 2;

  res.json({
    success: true,
    student: { _id: student._id, name: student.name, email: student.email, rollNumber: student.rollNumber, branch: student.branch, section: student.section, block: student.block },
    stats: {
      eventsRegistered: tickets.length,
      eventsAttended: attended,
      feedbackGiven: responses.length,
      certificatesEarned: certificates.length,
      engagementScore,
    },
    tickets,
    responses,
    certificates,
  });
});

// @route GET /api/students/breakdown — block/branch/section breakdown with CSV export support
exports.studentsBreakdown = asyncHandler(async (req, res) => {
  const students = await User.find({ organization: req.user.organization, role: 'participant' });
  const ticketCounts = await Ticket.aggregate([
    { $group: { _id: '$user', registrations: { $sum: 1 }, checkIns: { $sum: { $cond: [{ $eq: ['$status', 'checked_in'] }, 1, 0] } } } },
  ]);
  const countMap = Object.fromEntries(ticketCounts.map((c) => [c._id.toString(), c]));

  const breakdown = {};
  students.forEach((s) => {
    const key = `${s.block || 'Unknown'} / ${s.branch || 'Unknown'} / Section ${s.section || '-'}`;
    if (!breakdown[key]) breakdown[key] = { block: s.block, branch: s.branch, section: s.section, studentCount: 0, registrations: 0, checkIns: 0 };
    breakdown[key].studentCount += 1;
    const c = countMap[s._id.toString()];
    if (c) {
      breakdown[key].registrations += c.registrations;
      breakdown[key].checkIns += c.checkIns;
    }
  });

  const rows = Object.values(breakdown);

  if (req.query.format === 'csv') {
    const header = 'Block,Branch,Section,Students,Registrations,CheckIns\n';
    const csv = header + rows.map((r) => `${r.block || ''},${r.branch || ''},${r.section || ''},${r.studentCount},${r.registrations},${r.checkIns}`).join('\n');
    res.set({ 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="student-breakdown.csv"' });
    return res.send(csv);
  }

  if (req.query.format === 'xlsx') {
    const worksheet = XLSX.utils.json_to_sheet(
      rows.map((r) => ({
        Block: r.block || '', Branch: r.branch || '', Section: r.section || '',
        Students: r.studentCount, Registrations: r.registrations, CheckIns: r.checkIns,
      }))
    );
    worksheet['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 10 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Breakdown');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="student-breakdown.xlsx"',
    });
    return res.send(buffer);
  }

  res.json({ success: true, breakdown: rows });
});

// @route POST /api/analytics/upload — Excel/CSV upload analyzer, summarizes any uploaded spreadsheet
exports.analyzeSpreadsheet = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file uploaded');

  let rows = [];
  if (req.file.mimetype === 'text/csv') {
    const content = fs.readFileSync(req.file.path, 'utf-8');
    rows = parse(content, { columns: true, skip_empty_lines: true, trim: true });
  } else {
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
  }

  fs.unlink(req.file.path, () => {}); // don't retain the raw upload after analysis

  if (rows.length === 0) return res.json({ success: true, rowCount: 0, columns: [], summary: {} });

  const columns = Object.keys(rows[0]);
  const summary = {};

  columns.forEach((col) => {
    const values = rows.map((r) => r[col]).filter((v) => v !== '' && v !== null && v !== undefined);
    const numericValues = values.filter((v) => !isNaN(parseFloat(v)) && isFinite(v)).map(Number);
    const isNumeric = numericValues.length > 0 && numericValues.length === values.length;

    if (isNumeric) {
      const sum = numericValues.reduce((a, b) => a + b, 0);
      summary[col] = {
        type: 'numeric',
        count: numericValues.length,
        min: Math.min(...numericValues),
        max: Math.max(...numericValues),
        avg: Number((sum / numericValues.length).toFixed(2)),
        sum: Number(sum.toFixed(2)),
      };
    } else {
      const freq = {};
      values.forEach((v) => { freq[v] = (freq[v] || 0) + 1; });
      const topValues = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([value, count]) => ({ value, count }));
      summary[col] = { type: 'categorical', uniqueCount: Object.keys(freq).length, topValues };
    }
  });

  res.json({ success: true, rowCount: rows.length, columns, summary, preview: rows.slice(0, 10) });
});
