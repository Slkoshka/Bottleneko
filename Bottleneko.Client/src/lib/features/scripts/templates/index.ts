// JavaScript templates
import emptyJs from '../templates/empty.js?raw';
import logMessagesJs from '../templates/log-messages.js?raw';
import echoJs from '../templates/echo.js?raw';
import reminderJs from '../templates/reminder.js?raw';
import type { ScriptCode } from '$lib/api/bottleneko.gen';

const makeJsScript = (
    name: string,
    description: string,
    source: string,
): { name: string; description: string; code: ScriptCode } => {
    return {
        name,
        description,
        code: { $type: 'JavaScript', source },
    };
};

export default {
    javaScript: {
        name: 'JavaScript templates',
        templates: {
            empty: makeJsScript('Empty', 'Empty script template with a few useful imports.', emptyJs),
            logMessages: makeJsScript('Log Messages', 'Write incoming messages to the log.', logMessagesJs),
            echo: makeJsScript(
                'Echo',
                'Simple script that replies <code>321</code> every time it receives <code>123</code>.',
                echoJs,
            ),
            reminder: makeJsScript(
                'Reminder',
                `
                This example script demonstrates how to use:
                <ul>
                    <li><a href="https://en.wikipedia.org/wiki/Regular_expression">regular expressions</a> to filter incoming messages</li>
                    <li><code>neko.wait</code> function to delay execution</li>
                </ul>`,
                reminderJs,
            ),
        },
    },
};
