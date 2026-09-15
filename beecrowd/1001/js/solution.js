// 1001 - Extremely Basic
// https://judge.beecrowd.com/en/problems/view/1001
//
// Topics: input/output, arithmetic

function solve(input) {
  const [a, b] = input.trim().split(/\s+/).map(Number);

  return `X = ${a + b}\n`;
}

if (require.main === module) {
  const fs = require('fs');
  const input = fs.readFileSync(0, 'utf8');

  process.stdout.write(solve(input));
}

module.exports = { solve };
