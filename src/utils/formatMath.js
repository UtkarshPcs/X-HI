export const formatMath = (text) => {
  if (!text) return text;
  if (typeof text !== 'string') return text;
  
  return text
    // Handle literal escaped "\n" or "/n" strings
    .replace(/\\n/g, '\n')
    .replace(/\/n/g, '\n')
    // Double backslash parens -> inline math
    .replace(/\\\\\(/g, '$').replace(/\\\\\)/g, '$')
    // Double backslash brackets -> block math
    .replace(/\\\\\[/g, '$$').replace(/\\\\\]/g, '$$')
    // Single backslash parens -> inline math
    .replace(/\\\(/g, '$').replace(/\\\)/g, '$')
    // Single backslash brackets -> block math
    .replace(/\\\[/g, '$$').replace(/\\\]/g, '$$')
    // Double backslash commands -> single backslash commands
    .replace(/\\\\([a-zA-Z])/g, '\\$1')
    // Add two spaces before newlines to ensure Markdown hard line breaks
    .replace(/\n/g, '  \n');
};
