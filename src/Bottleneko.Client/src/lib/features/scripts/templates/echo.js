import { messages, log } from 'neko';

await messages.received.listen(async (msg) => {
    log.info(`Received '${msg.text}' from ${msg.author.displayName}`);

    if (msg.text === '123') {
        await msg.replyText('321');
    }
});
