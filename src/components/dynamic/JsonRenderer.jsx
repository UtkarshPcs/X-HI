import React from 'react';

// A mapping of JSON node types to actual HTML tags or React components.
// We can easily expand this to include custom brand components (e.g., auth-btn, glass-card).
const ComponentRegistry = {
  Container: 'div',
  Text: 'p',
  Heading: ({ level = 2, children, ...props }) => {
    const Tag = `h${level}`;
    return <Tag {...props}>{children}</Tag>;
  },
  Button: ({ children, onClickUrl, variant = 'primary', className = '', ...props }) => (
    <button 
      className={`auth-btn ${variant === 'secondary' ? 'secondary' : ''} ${className}`} 
      onClick={() => onClickUrl && window.open(onClickUrl, '_blank')}
      {...props}
    >
      {children}
    </button>
  ),
  Card: ({ children, className = '', ...props }) => (
    <div className={`glass-card p-6 rounded-2xl border border-white/10 ${className}`} {...props}>
      {children}
    </div>
  ),
  Image: ({ src, alt, className = '', style, ...props }) => (
    <img 
      src={src} 
      alt={alt} 
      className={className}
      style={{ maxWidth: '100%', borderRadius: '8px', objectFit: 'cover', ...style }} 
      {...props} 
    />
  ),
  List: 'ul',
  ListItem: 'li',
  Span: 'span',
  Divider: ({ className = '', ...props }) => <hr className={`border-white/10 my-4 ${className}`} {...props} />
};

export default function JsonRenderer({ node }) {
  // If the node is just a primitive (string, number), render it directly.
  if (typeof node === 'string' || typeof node === 'number') {
    return node;
  }
  
  // Invalid or empty node
  if (!node || !node.type) {
    return null;
  }

  // Find the component from the registry, fallback to the raw type (e.g., 'div', 'span') if not found.
  const Component = ComponentRegistry[node.type] || node.type;
  
  // Render the component and recursively render its children.
  return (
    <Component {...(node.props || {})}>
      {Array.isArray(node.children) 
        ? node.children.map((child, i) => <JsonRenderer key={i} node={child} />)
        : node.children ? <JsonRenderer node={node.children} /> : null
      }
    </Component>
  );
}
