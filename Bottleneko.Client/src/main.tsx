/* eslint-disable import/default */
import { createRoot } from 'react-dom/client';

import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

import App from './App';
import './index.css';
import 'highlight.js/styles/an-old-hope.min.css';
import { branding } from './props';

self.MonacoEnvironment = {
    getWorker(_, label) {
        if (label === 'json') {
            return new jsonWorker();
        }
        if (label === 'css' || label === 'scss' || label === 'less') {
            return new cssWorker();
        }
        if (label === 'html' || label === 'handlebars' || label === 'razor') {
            return new htmlWorker();
        }
        if (label === 'typescript' || label === 'javascript') {
            return new tsWorker();
        }
        return new editorWorker();
    },
};

loader.config({ monaco });

async function init() {
    await loader.init();

    const root = document.getElementById('root');
    if (!root) {
        throw new Error('Can\'t find root element');
    }

    document.title = branding.plain;

    createRoot(root).render(
        <App />,
    );
}

void init();
