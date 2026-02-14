import type { ChatSummary } from "../chats.ts";
import type { ChatSummaryDto } from './api/bottleneko.gen.ts';

export class internal__ChatSummaryImpl implements ChatSummary {
    id: string;
    displayName: string;

    constructor(chat: ChatSummaryDto) {
        this.id = chat.id;
        this.displayName = chat.displayName;
    }
}
