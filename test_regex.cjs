const raw = '{"q": "\\\\\\\\alpha"}'; // string representing {"q": "\\\\alpha"}
console.log("Original raw:", raw);
const processed = raw.replace(/\\\\\\\\/g, '\\\\');
console.log("Processed:", processed);
console.log("Parsed original:", JSON.parse(raw));
console.log("Parsed processed:", JSON.parse(processed));
