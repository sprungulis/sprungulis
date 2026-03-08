// required dependencies: node.js , npm
// required codemirror6 dependencies: npm install @codemirror/view @codemirror/state @codemirror/commands @codemirror/language @codemirror/lang-javascript
// now stored in package, so can just run npm install and everything neccessary will download

import React, { useEffect, useRef, useState } from 'react';
import { EditorView, Decoration } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { python } from '@codemirror/lang-python'; // ?


function CodeEditor({onChange , value, highlight}) {
    const editorRef = useRef(null);
    const viewRef = useRef(null);
    const [currentDeco, setCurrentDeco] = useState([]);
    const isUpdatingRef = useRef(false);

    useEffect(() => {
        if(!editorRef.current) return;
        
        const state = EditorState.create({
            doc: value,
            extensions: [
                basicSetup,
                python(),
                EditorView.updateListener.of((update) => {
                    if (update.docChanged && !isUpdatingRef.current && typeof onChange === 'function') {
                        onChange(update.state.doc.toString());
                    }
                }),
                EditorView.decorations.of(() => Decoration.set(currentDeco))
            ]
        });

        const view = new EditorView({
            state,
            parent: editorRef.current
        });

        viewRef.current = view;

        return () => {
            view.destroy();
        }
    }, []);

    useEffect(() => {
        if (viewRef.current && value !== viewRef.current.state.doc.toString()) {
            isUpdatingRef.current = true;
            const transaction = viewRef.current.state.update({
                changes: { from: 0, to: viewRef.current.state.doc.length, insert: value }
            });
            viewRef.current.dispatch(transaction);
            isUpdatingRef.current = false;

            // Add highlight decoration if provided
            if (highlight) {
                const state = viewRef.current.state;
                const lineObj = state.doc.line(highlight.line + 1);
                const start = lineObj.from + highlight.col;
                const end = start + highlight.length;
                const deco = Decoration.mark({class: "highlight"}).range(start, end);
                setCurrentDeco([deco]);
                setTimeout(() => setCurrentDeco([]), 3000); // Remove after 3 seconds
            }
        }
    }, [value, highlight]);

    return (
        <div
            ref={editorRef}
            style={{
                fontFamily: 'monospace'
            }}
        />
    );
}

export default CodeEditor;

