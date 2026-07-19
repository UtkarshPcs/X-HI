const fs = require('fs');
const test1 = '{"question": "$\\\\alpha$"}';
const test2 = '{"question": "$\\\\\\\\alpha$"}';

console.log("Single escape (JSON: \\\\alpha):", JSON.parse(test1).question);
console.log("Double escape (JSON: \\\\\\\\alpha):", JSON.parse(test2).question);
