const AuditLog = require('../models/AuditLog');

/**
 * Fire-and-forget audit log write. Never throws — a failed audit write
 * should never break the primary request.
 */
async function logAudit({ organization = null, actor = null, action, entityType = null, entityId = null, ip = null, metadata = {} }) {
  try {
    await AuditLog.create({ organization, actor, action, entityType, entityId, ip, metadata });
  } catch (err) {
    console.error('[audit] failed to write audit log:', err.message);
  }
}

module.exports = { logAudit };
