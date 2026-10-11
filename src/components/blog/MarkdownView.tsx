import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Box } from '@mui/material';

interface MarkdownViewProps {
  /** Markdown 原文 */
  content: string;
}

/**
 * Markdown 正文渲染：react-markdown + remark-gfm + rehype-highlight。
 * 排版样式由 src/styles/index.css 的 .markdown-body 作用域提供。
 */
export default function MarkdownView({ content }: MarkdownViewProps): JSX.Element {
  return (
    <Box className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          a: ({ href, children, ...props }) => (
            <a href={href} target="_blank" rel="noreferrer noopener" {...props}>
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
}
