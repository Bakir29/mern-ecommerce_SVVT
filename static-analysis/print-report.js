const data = require('./server-eslint-report.json');
for (const fr of data) {
  if (!fr.messages.length) continue;
  const rel = fr.filePath.split('mern-ecommerce')[1];
  console.log('=== ' + rel + ' ===');
  for (const m of fr.messages) {
    console.log('  L' + m.line + ':' + m.column + '  [' + (m.severity === 2 ? 'ERROR' : 'WARN') + ']  ' + (m.ruleId || 'parse-error') + '  ' + m.message);
  }
}
