import { messages, log } from 'neko';

await messages.received.listen(async (msg) => {
    log.info(`Received '${msg.text}' from ${msg.author.name}`);
});
