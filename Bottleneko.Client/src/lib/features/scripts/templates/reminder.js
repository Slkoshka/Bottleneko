import neko from 'neko';
import log from 'neko/log';
import when from 'neko/when';

const regex = /^remind me in (?:(?<seconds>1) second|(?<seconds>\d+) seconds)$/;

when.connection.messageReceived(
    async (msg) => {
        // Event callbacks can be async functions
        const match = regex.exec(msg.text); // Match the regular expression (the text filter guarantees that we have a valid match)
        const seconds = Number.parseInt(match.groups.seconds); // This should be the number of seconds parsed as an integer
        const milliseconds = seconds * 1000; // neko.wait() expects the time in milliseconds

        log.info(`Waiting ${milliseconds} ms...`);

        await neko.wait(milliseconds); // Now we wait

        msg.reply('meow!');
    },
    {
        text: regex,
    },
);
