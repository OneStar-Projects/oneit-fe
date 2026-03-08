/*
 * SQL Monaco Editor - 基于 Monaco Editor 的 SQL 编辑器
 * @fc-components/monaco-editor 未导出 SqlMonacoEditor，在此实现
 */
import React, { useEffect, useRef } from 'react';
import MonacoEditor from 'react-monaco-editor';
import * as monaco from 'monaco-editor';
import type * as monacoTypes from 'monaco-editor/esm/vs/editor/editor.api';
import { v4 as uuidv4 } from 'uuid';
import { css } from '@emotion/css';

const themeMap: Record<string, string> = {
  light: 'sql-light',
  dark: 'sql-dark',
};

const containerDisabledClassName = css`
  .monaco-editor {
    user-select: none;
    pointer-events: none;
  }
`;

const getStyles = (placeholder?: string) => ({
  placeholder: css({
    '::after': {
      content: `'${placeholder}'`,
      opacity: 0.6,
    },
  }),
});

export interface SqlMonacoEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  onEnter?: (value: string) => void;
  onBlur?: (value: string) => void;
  onFocus?: () => void;
  placeholder?: string;
  theme?: 'light' | 'dark';
  disabled?: boolean;
  maxHeight?: number;
  enableAutocomplete?: boolean;
  className?: string;
}

export default function SqlMonacoEditor(props: SqlMonacoEditorProps) {
  const id = uuidv4();
  const {
    value,
    onChange,
    onEnter,
    onBlur,
    onFocus,
    placeholder,
    theme = 'light',
    disabled = false,
    enableAutocomplete = true,
    className = '',
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monacoTypes.editor.IStandaloneCodeEditor | null>(null);
  const styles = getStyles(placeholder);

  const handleEditorDidMount = (editor: monacoTypes.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;

    monaco.editor.defineTheme('sql-light', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#00000000',
        focusBorder: '#00000000',
      },
    });

    monaco.editor.defineTheme('sql-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#00000000',
        focusBorder: '#00000000',
      },
    });

    const isEditorFocused = editor.createContextKey<boolean>('isEditorFocused' + id, false);

    editor.onDidBlurEditorWidget(() => {
      isEditorFocused.set(false);
      onBlur?.(editor.getValue());
      const position = editor.getPosition();
      if (position) {
        const sel = new monaco.Selection(position.lineNumber, position.column, position.lineNumber, position.column);
        editor.setSelection(sel);
      }
    });

    editor.onDidFocusEditorText(() => {
      isEditorFocused.set(true);
      onFocus?.();
    });

    const updateElementHeight = () => {
      const containerDiv = containerRef.current;
      if (containerDiv) {
        const pixelHeight = Math.max(editor.getContentHeight(), 20);
        containerDiv.style.height = `${pixelHeight}px`;
        containerDiv.style.width = '100%';
        editor.layout({ width: containerDiv.clientWidth, height: pixelHeight });
      }
    };

    editor.onDidContentSizeChange(updateElementHeight);
    updateElementHeight();

    monaco.editor.addKeybindingRule({
      keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF,
      command: null,
    });

    editor.addCommand(
      monaco.KeyMod.Shift | monaco.KeyCode.Enter,
      () => {
        const position = editor.getPosition();
        if (position) {
          editor.executeEdits('shift-enter', [
            {
              range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
              text: '\n',
            },
          ]);
          editor.setPosition({ lineNumber: position.lineNumber + 1, column: 1 });
        }
      },
      'isEditorFocused' + id,
    );

    if (onEnter) {
      editor.addCommand(
        monaco.KeyCode.Enter,
        () => onEnter(editor.getValue()),
        '!suggestWidgetVisible && isEditorFocused' + id,
      );
    }
  };

  useEffect(() => {
    if (!monaco.languages.getLanguages().some((l) => l.id === 'sql')) {
      monaco.languages.register({ id: 'sql', aliases: ['SQL', 'sql'], extensions: ['.sql'], mimetypes: ['application/sql'] });
    }
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const model = editor.getModel();
    if (!model) return;

    model.deltaDecorations(
      model.getAllDecorations().map((d) => d.id),
      [],
    );

    if (placeholder) {
      const placeholderDecorators = [
        {
          range: new monaco.Range(1, 1, 1, 1),
          options: { className: styles.placeholder, isWholeLine: true },
        },
      ];
      let decorators: string[] = [];
      const checkDecorators = () => {
        const m = editor.getModel();
        if (!m) return;
        decorators = m.deltaDecorations(decorators, m.getValueLength() === 0 ? placeholderDecorators : []);
      };
      checkDecorators();
      const dispose = editor.onDidChangeModelContent(checkDecorators);
      return () => dispose.dispose();
    }
  }, [placeholder]);

  return (
    <div className={`ant-input ${disabled ? `ant-input-disabled ${containerDisabledClassName}` : ''} ${className}`}>
      <div ref={containerRef}>
        <MonacoEditor
          width='100%'
          height='100%'
          language='sql'
          theme={themeMap[theme]}
          value={value}
          onChange={onChange}
          editorDidMount={handleEditorDidMount}
          options={{
            readOnly: disabled,
            codeLens: false,
            contextmenu: false,
            fixedOverflowWidgets: true,
            folding: true,
            fontSize: 12,
            lineDecorationsWidth: 0,
            lineNumbers: 'on',
            minimap: { enabled: false },
            overviewRulerBorder: false,
            overviewRulerLanes: 0,
            padding: { top: 1, bottom: 1 },
            renderLineHighlight: 'none',
            scrollbar: {
              vertical: 'auto',
              verticalScrollbarSize: 8,
              horizontal: 'auto',
              horizontalScrollbarSize: 8,
              alwaysConsumeMouseWheel: false,
            },
            scrollBeyondLastLine: false,
            suggest: {
              showWords: true,
              filterGraceful: true,
              snippetsPreventQuickSuggestions: false,
              shareSuggestSelections: false,
            },
            quickSuggestions: enableAutocomplete ? { other: true, comments: false, strings: true } : false,
            suggestFontSize: 12,
            wordWrap: 'on',
            automaticLayout: true,
            occurrencesHighlight: 'off',
          }}
        />
      </div>
    </div>
  );
}
