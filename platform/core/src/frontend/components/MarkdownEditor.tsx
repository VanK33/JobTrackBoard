import { useCallback, useRef } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { htmlToMarkdown } from '../utils/markdown';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Enter description with formatting...',
  height = 300,
}: MarkdownEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  const handleChange = useCallback(
    (newValue?: string) => {
      onChange(newValue || '');
    },
    [onChange]
  );

  const handlePaste = useCallback(
    (event: React.ClipboardEvent) => {
      const clipboardData = event.clipboardData;
      const htmlData = clipboardData.getData('text/html');

      if (htmlData) {
        event.preventDefault();
        const markdown = htmlToMarkdown(htmlData);

        // Insert markdown at current cursor position
        // Since we can't easily get cursor position in MDEditor,
        // we'll append to the current value
        const newValue = value + (value ? '\n\n' : '') + markdown;
        onChange(newValue);
      }
    },
    [value, onChange]
  );

  return (
    <div
      ref={editorRef}
      onPaste={handlePaste}
      data-color-mode="light"
      style={{
        width: '100%',
        marginBottom: '10px',
      }}
    >
      <MDEditor
        value={value}
        onChange={handleChange}
        height={height}
        preview="edit"
        hideToolbar={false}
        enableScroll={true}
        visibleDragbar={true}
        textareaProps={{
          placeholder,
        }}
        previewOptions={{
          remarkPlugins: [],
        }}
        style={{
          borderRadius: '4px',
          border: '1px solid #ddd',
          backgroundColor: '#ffffff',
        }}
      />
    </div>
  );
}
