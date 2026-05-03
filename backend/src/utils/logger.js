/**
 * Tiny structured logger. Avoids extra deps.
 */
function ts() {
  return new Date().toISOString();
}

function fmt(level, msg, meta) {
  const base = `[${ts()}] ${level} ${msg}`;
  if (!meta) return base;
  if (meta instanceof Error) return `${base} :: ${meta.stack || meta.message}`;
  try {
    return `${base} :: ${JSON.stringify(meta)}`;
  } catch {
    return base;
  }
}

module.exports = {
  info: (msg, meta) => console.log(fmt('INFO', msg, meta)),
  warn: (msg, meta) => console.warn(fmt('WARN', msg, meta)),
  error: (msg, meta) => console.error(fmt('ERROR', msg, meta)),
};
