const data = require('./client-eslint-report.json');
const ruleFilter = process.argv[2];
for (const fr of data) {
  const msgs = ruleFilter ? fr.messages.filter(m => m.ruleId === ruleFilter) : fr.messages;
  if (!msgs.length) continue;
  const rel = fr.filePath.split('client')[1];
  console.log('=== ' + rel + ' ===');
  for (const m of msgs) {
    console.log('  L' + m.line + ':' + m.column + '  [' + (m.severity === 2 ? 'ERROR' : 'WARN') + ']  ' + (m.ruleId || 'parse-error') + '  ' + m.message);
  }
}
