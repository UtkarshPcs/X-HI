try {
  JSON.parse('{"x": "\\alpha"}');
  console.log("Parsed successfully!");
} catch (e) {
  console.log("Error:", e.message);
}
