import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer = memo(({ content, className }: MarkdownRendererProps) => {
  const styles: React.CSSProperties = {
    lineHeight: '1.6',
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
  };

  const markdownStyles = {
    markdown: {
      ...styles,
    },
    h1: {
      fontSize: '1.8em',
      fontWeight: 'bold',
      marginTop: '0.5em',
      marginBottom: '0.5em',
      borderBottom: '1px solid #e0e0e0',
      paddingBottom: '0.3em',
    },
    h2: {
      fontSize: '1.5em',
      fontWeight: 'bold',
      marginTop: '0.5em',
      marginBottom: '0.5em',
    },
    h3: {
      fontSize: '1.3em',
      fontWeight: 'bold',
      marginTop: '0.5em',
      marginBottom: '0.5em',
    },
    ul: {
      marginLeft: '1.5em',
      marginTop: '0.5em',
      marginBottom: '0.5em',
    },
    ol: {
      marginLeft: '1.5em',
      marginTop: '0.5em',
      marginBottom: '0.5em',
    },
    li: {
      marginBottom: '0.25em',
    },
    p: {
      marginTop: '0.5em',
      marginBottom: '0.5em',
    },
    a: {
      color: '#0066cc',
      textDecoration: 'underline',
    },
    code: {
      backgroundColor: '#f4f4f4',
      padding: '0.2em 0.4em',
      borderRadius: '3px',
      fontFamily: 'monospace',
      fontSize: '0.9em',
    },
    pre: {
      backgroundColor: '#f4f4f4',
      padding: '1em',
      borderRadius: '5px',
      overflow: 'auto',
      marginTop: '0.5em',
      marginBottom: '0.5em',
    },
    blockquote: {
      borderLeft: '4px solid #e0e0e0',
      paddingLeft: '1em',
      marginLeft: '0',
      color: '#666',
      fontStyle: 'italic',
    },
  };

  return (
    <div style={markdownStyles.markdown} className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 style={markdownStyles.h1}>{children}</h1>,
          h2: ({ children }) => <h2 style={markdownStyles.h2}>{children}</h2>,
          h3: ({ children }) => <h3 style={markdownStyles.h3}>{children}</h3>,
          ul: ({ children }) => <ul style={markdownStyles.ul}>{children}</ul>,
          ol: ({ children }) => <ol style={markdownStyles.ol}>{children}</ol>,
          li: ({ children }) => <li style={markdownStyles.li}>{children}</li>,
          p: ({ children }) => <p style={markdownStyles.p}>{children}</p>,
          a: ({ children, href }) => (
            <a href={href} style={markdownStyles.a} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          code: ({ children, className }) => {
            const isInline = !className;
            return isInline ? (
              <code style={markdownStyles.code}>{children}</code>
            ) : (
              <pre style={markdownStyles.pre}>
                <code>{children}</code>
              </pre>
            );
          },
          blockquote: ({ children }) => (
            <blockquote style={markdownStyles.blockquote}>{children}</blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

MarkdownRenderer.displayName = 'MarkdownRenderer';

export default MarkdownRenderer;
