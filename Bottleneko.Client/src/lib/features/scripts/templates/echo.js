import neko from 'neko';
import log from 'neko/log';
import when from 'neko/when';

when.connection.messageReceived(
    (msg) => {
        log.info(`Received '${msg.text}' from ${msg.author.displayName}`);

        msg.reply('321');
    },
    {
        text: '123',
    },
);
