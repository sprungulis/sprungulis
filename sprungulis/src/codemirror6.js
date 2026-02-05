// required dependencies: node.js , npm
// required codemirror6 dependencies: npm install @codemirror/view @codemirror/state @codemirror/commands @codemirror/language @codemirror/lang-javascript
// now stored in package, so can just run npm install and everything neccessary will download

import React, { useEffect, useRef } from 'react';
import { EditorView } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript'; // ?


function CodeEditor() {
    const editorRef = useRef(null);
    const viewRef = useRef(null);

    useEffect(() => {
        if(!editorRef.current) return;


        const state = EditorState.create({
            doc: '// write your code here\nconst hello = "world";',
            extensions: [
                basicSetup,
                javascript(),
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

    return (
        <div
            ref={editorRef}
            style={{
                height: '500px',
                margin: '100px',
                border: '1px solid #ccc',
                //display: 'flex',
                width: '500px',
                //alignContent: 'left',
                /* backgroundColor: 'black',
                color: '#39FF14', */
                fontFamily: 'monospace'
                
            }}
        />
    );
}

export default CodeEditor;

