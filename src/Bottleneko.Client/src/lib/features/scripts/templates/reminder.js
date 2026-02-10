import { messages, log } from 'neko';

const regex = /^remind me in (?:(?<seconds>1) second|(?<seconds>\d+) seconds)$/;

await messages.received.listen(async (msg) => {
    // Event callbacks can be async functions
    const match = regex.exec(msg.text);
    if (match === null) {
        return;
    }

    const seconds = Number.parseInt(match.groups.seconds); // This should be the number of seconds parsed as an integer
    const milliseconds = seconds * 1000; // neko.wait() expects the time in milliseconds

    log.info(`Waiting ${milliseconds} ms...`);

    await new Promise((resolve) => setTimeout(resolve, milliseconds)); // Now we wait

    await msg.replyText('meow!');
});
