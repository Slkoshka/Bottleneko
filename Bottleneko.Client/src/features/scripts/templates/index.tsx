/* eslint-disable @stylistic/jsx-one-expression-per-line */
/* eslint-disable import/default */
/* eslint-disable import/extensions */

import { ReactNode } from 'react';

// JavaScript templates
import emptyJs from '../templates/empty.js?raw';
import logMessagesJs from '../templates/log-messages.js?raw';
import echoJs from '../templates/echo.js?raw';
import reminderJs from '../templates/reminder.js?raw';
import { ScriptCode } from '../../api/dtos.gen';

const makeJsScript = (name: string, description: ReactNode, source: string): { name: string; description: ReactNode; code: ScriptCode } => {
    return ({
        name,
        description,
        code: { $type: 'JavaScript', source },
    });
};

const graph = {
    empty: { name: 'Empty Graph', description: <>Empty control graph.</>, code: { $type: 'Graph' as const, nodes: [], connections: [] } },
};

const javaScript = {
    empty: makeJsScript('Empty', <>Empty script template with a few useful imports.</>, emptyJs),
    logMessages: makeJsScript('Log Messages', <>Write incoming messages to the log.</>, logMessagesJs),
    echo: makeJsScript('Echo', <>Simple script that replies <code>321</code> every time it receives <code>123</code>.</>, echoJs),
    reminder: makeJsScript('Reminder', (
        <>
            This example script demonstrates how to use:
            <ul>
                <li><a href="https://en.wikipedia.org/wiki/Regular_expression">regular expressions</a> to filter incoming messages</li>
                <li><code>neko.wait</code> function to delay execution</li>
            </ul>
        </>
    ), reminderJs),
};

export default {
    graph,
    javaScript,
};
