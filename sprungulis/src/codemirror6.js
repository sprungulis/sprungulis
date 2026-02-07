// required dependencies: node.js , npm
// required codemirror6 dependencies: npm install @codemirror/view @codemirror/state @codemirror/commands @codemirror/language @codemirror/lang-javascript
// now stored in package, so can just run npm install and everything neccessary will download

import React, { useEffect, useRef } from 'react';
import { EditorView } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript'; // ?


function CodeEditor({onChange , initialDoc}) {
    const editorRef = useRef(null);
    const viewRef = useRef(null);

    useEffect(() => {
        if(!editorRef.current) return;
        
        const state = EditorState.create({
            doc: '// write your code here\nconst hello = "world";\nconsole.log(hello);',
            extensions: [
                basicSetup,
                javascript(),
                EditorView.updateListener.of((update) => {
                    if (update.docChanged && typeof onChange === 'function') {
                        onChange(update.state.doc.toString());
                    }
                })
            ]
        });

        if (!typeof onChange === 'function') {
            onChange(state.doc.toString());
        }

        const view = new EditorView({
            state,
            parent: editorRef.current
        });

        viewRef.current = view;

        return () => {
            view.destroy();
        }
    }, [initialDoc, onChange]);

    return (
        <div
            ref={editorRef}
            style={{
                height: '500px',
                border: '1px solid #ccc',
                width: '500px',
                fontFamily: 'monospace'
            }}
        />
    );
}

export default CodeEditor;

