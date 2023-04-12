import { useEffect } from 'react';
import { clsx } from 'clsx';

import { useEditorContext } from '../context';
import { useGlobalsEditor, UseGlobalsEditorArgs } from '../globals-editor';

import '../style/codemirror.css';
import '../style/fold.css';
import '../style/lint.css';
import '../style/hint.css';
import '../style/editor.css';

type GlobalsEditorProps = UseGlobalsEditorArgs & {
  /**
   * Visually hide the header editor.
   * @default false
   */
  isHidden?: boolean;
};

export function GlobalsEditor({ isHidden, ...hookArgs }: GlobalsEditorProps) {
  const { globalsEditor } = useEditorContext({
    nonNull: true,
    caller: GlobalsEditor,
  });
  const ref = useGlobalsEditor(hookArgs, GlobalsEditor);

  useEffect(() => {
    if (globalsEditor && !isHidden) {
      globalsEditor.refresh();
    }
  }, [globalsEditor, isHidden]);

  return (
    <div className={clsx('graphiql-editor', isHidden && 'hidden')} ref={ref} />
  );
}
