import type { SchemaReference } from 'codemirror-graphql/utils/SchemaReference';
import { useEffect, useRef } from 'react';

import { useExecutionContext } from '../execution';
import {
  commonKeys,
  DEFAULT_EDITOR_THEME,
  DEFAULT_KEY_MAP,
  importCodeMirror,
} from './common';
import { useEditorContext } from './context';
import {
  useChangeHandler,
  useCompletion,
  useKeyMap,
  useMergeQuery,
  usePrettifyEditors,
  useSynchronizeOption,
} from './hooks';
import { CodeMirrorType, WriteableEditorProps } from './types';

export type UseGlobalsEditorArgs = WriteableEditorProps & {
  /**
   * Invoked when the contents of the globals editor change.
   * @param value The new contents of the editor.
   */
  onEdit?(value: string): void;
};

export function useGlobalsEditor(
  {
    editorTheme = DEFAULT_EDITOR_THEME,
    keyMap = DEFAULT_KEY_MAP,
    onEdit,
    readOnly = false,
  }: UseGlobalsEditorArgs = {},
  caller?: Function,
) {
  const { initialGlobals, globalsEditor, setGlobalsEditor } = useEditorContext({
    nonNull: true,
    caller: caller || useGlobalsEditor,
  });
  const executionContext = useExecutionContext();
  const merge = useMergeQuery({ caller: caller || useGlobalsEditor });
  const prettify = usePrettifyEditors({ caller: caller || useGlobalsEditor });
  const ref = useRef<HTMLDivElement>(null);
  const codeMirrorRef = useRef<CodeMirrorType>();

  useEffect(() => {
    let isActive = true;

    importCodeMirror([
      // import('codemirror-graphql/esm/variables/hint'),
      // import('codemirror-graphql/esm/variables/lint'),
      // import('codemirror-graphql/esm/variables/mode'),
      // @ts-ignore
      import('codemirror/mode/javascript/javascript'),
    ]).then(CodeMirror => {
      // Don't continue if the effect has already been cleaned up
      if (!isActive) {
        return;
      }

      codeMirrorRef.current = CodeMirror;

      const container = ref.current;
      if (!container) {
        return;
      }

      const newEditor = CodeMirror(container, {
        value: initialGlobals,
        lineNumbers: true,
        tabSize: 2,
        mode: { name: 'javascript', json: true },
        theme: editorTheme,
        autoCloseBrackets: true,
        matchBrackets: true,
        showCursorWhenSelecting: true,
        readOnly: readOnly ? 'nocursor' : false,
        foldGutter: true,
        lint: {
          // @ts-expect-error
          variableToType: undefined,
        },
        hintOptions: {
          closeOnUnfocus: false,
          completeSingle: false,
          container,
          // @ts-expect-error
          variableToType: undefined,
        },
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
        extraKeys: commonKeys,
      });

      // newEditor.addKeyMap({
      //   'Cmd-Space'() {
      //     newEditor.showHint({ completeSingle: false, container });
      //   },
      //   'Ctrl-Space'() {
      //     newEditor.showHint({ completeSingle: false, container });
      //   },
      //   'Alt-Space'() {
      //     newEditor.showHint({ completeSingle: false, container });
      //   },
      //   'Shift-Space'() {
      //     newEditor.showHint({ completeSingle: false, container });
      //   },
      // });

      newEditor.on('keyup', (editorInstance, event) => {
        const code = event.keyCode;
        if (
          (code >= 65 && code <= 90) || // letters
          (!event.shiftKey && code >= 48 && code <= 57) || // numbers
          (event.shiftKey && code === 189) || // underscore
          (event.shiftKey && code === 222) // "
        ) {
          editorInstance.execCommand('autocomplete');
        }
      });

      setGlobalsEditor(newEditor);
    });

    return () => {
      isActive = false;
    };
  }, [editorTheme, initialGlobals, readOnly, setGlobalsEditor]);

  useSynchronizeOption(globalsEditor, 'keyMap', keyMap);

  useChangeHandler(
    globalsEditor,
    onEdit,
    STORAGE_KEY,
    'globals',
    useGlobalsEditor,
  );

  useCompletion(globalsEditor, null, useGlobalsEditor);

  useKeyMap(globalsEditor, ['Cmd-Enter', 'Ctrl-Enter'], executionContext?.run);
  useKeyMap(globalsEditor, ['Shift-Ctrl-P'], prettify);
  useKeyMap(globalsEditor, ['Shift-Ctrl-M'], merge);

  return ref;
}

export const STORAGE_KEY = 'globals';
