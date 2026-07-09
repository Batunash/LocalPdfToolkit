const fs = require('fs');
const path = require('path');
const cov = JSON.parse(fs.readFileSync(path.join(__dirname, 'coverage', 'coverage-final.json'), 'utf8'));

const tw = Object.keys(cov).find(k => k.includes('ToolWrapper.tsx'));
if (!tw) {
  console.log('ToolWrapper.tsx not found in coverage');
  process.exit(0);
}
const data = cov[tw];

console.log('--- Uncovered Statements ---');
Object.keys(data.s).forEach(k => {
  if (data.s[k] === 0) {
    console.log(`Line ${data.statementMap[k].start.line}`);
  }
});

console.log('\n--- Uncovered Branches ---');
Object.keys(data.b).forEach(k => {
  data.b[k].forEach((count, i) => {
    if (count === 0) {
      console.log(`Line ${data.branchMap[k].loc.start.line} branch ${i}`);
    }
  });
});
