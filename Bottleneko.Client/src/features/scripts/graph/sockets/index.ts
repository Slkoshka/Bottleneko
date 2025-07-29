import { ClassicPreset } from 'rete';

export class NekoSocket extends ClassicPreset.Socket {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(readonly type: string, name: string, private readonly compatibleSockets?: any[]) {
        super(name);
    }

    isCompatibleWith(socket: ClassicPreset.Socket) {
        if (!this.compatibleSockets) {
            return false;
        }

        for (const type of this.compatibleSockets) {
            if (socket instanceof type) {
                return true;
            }
        }

        return false;
    }
}

export class SplittableObjectSocket extends NekoSocket {
    constructor(type: string, name: string, compatibleSockets?: unknown[]) {
        super(type, `[Structure] ${name}`, [...(compatibleSockets ?? []), SplittableInputSocket]);
    }

    parts(): { id: string; name: string; constructor: () => NekoSocket; singleConnection?: boolean }[] {
        return [];
    }
}

export class SwitchableObjectSocket extends NekoSocket {
    constructor(type: string, name: string, compatibleSockets?: unknown[]) {
        super(type, `[Enum] ${name}`, [...(compatibleSockets ?? []), SwitchableInputSocket]);
    }

    options(): { id: string; name: string }[] {
        return [];
    }
}

export class ExecSocket extends NekoSocket {
    constructor() { super('exec', 'Execution Flow', [ExecSocket]); }
}

export class BooleanSocket extends SwitchableObjectSocket {
    constructor() { super('boolean', 'Boolean (true or false)', [BooleanSocket, StringSocket, NumberSocket]); }

    options() {
        return [
            { id: 'true', name: 'True' },
            { id: 'false', name: 'False' },
        ];
    }
}

export class NumberSocket extends NekoSocket {
    constructor() { super('number', 'Number', [NumberSocket, StringSocket]); }
}

export class StringSocket extends NekoSocket {
    constructor() { super('string', 'Text', [StringSocket]); }
}

export class IdSocket extends NekoSocket {
    constructor() { super('id', 'ID', [IdSocket, StringSocket]); }
}

export class ProtocolSocket extends SwitchableObjectSocket {
    constructor() { super('protocol', 'Protocol', [ProtocolSocket, StringSocket]); }

    options() {
        return [
            { id: 'discord', name: 'Discord' },
            { id: 'telegram', name: 'Telegram' },
            { id: 'twitch', name: 'Twitch' },
        ];
    }
}

export class TimestampSocket extends NekoSocket {
    constructor() { super('timestamp', 'Timestamp', [TimestampSocket, StringSocket]); }
}

export class ChatSocket extends NekoSocket {
    constructor() { super('chat', 'Chat', [ChatSocket]); }
}

export class ChatMessageSocket extends SplittableObjectSocket {
    constructor() { super('chat-message', 'Chat Message', [ChatMessageSocket]); }

    parts() {
        return [
            { id: 'id', name: 'ID', constructor: () => new IdSocket() },
            { id: 'protocol', name: 'Protocol', constructor: () => new ProtocolSocket() },
            { id: 'connectionId', name: 'Connection ID', constructor: () => new IdSocket() },
            { id: 'timestamp', name: 'Timestamp', constructor: () => new TimestampSocket() },
            { id: 'chat', name: 'Chat', constructor: () => new ChatSocket() },
            { id: 'author', name: 'Author', constructor: () => new ChatterSocket() },
            { id: 'text', name: 'Text', constructor: () => new OptionalSocket(StringSocket) },
            { id: 'replyTo', name: 'Reply To', constructor: () => new OptionalSocket(IdSocket) },
        ];
    }
}

export class ChatterSocket extends NekoSocket {
    constructor() { super('chatter', 'Chat User', [ChatterSocket]); }
}

export class OptionalInputSocket extends NekoSocket {
    constructor() { super('any-optional', 'Any Optional Value'); }
}

export class SplittableInputSocket extends NekoSocket {
    constructor() { super('splittable', 'Any Structure'); }
}

export class SwitchableInputSocket extends NekoSocket {
    constructor() { super('switchable', 'Any Enum'); }
}

export class OptionalSocket<T extends NekoSocket> extends NekoSocket {
    constructor(readonly innerType: new () => T) { super('optional', `${new innerType().name} (Optional)`); }

    isCompatibleWith(socket: ClassicPreset.Socket) {
        const socketType = socket instanceof OptionalSocket ? new (socket as OptionalSocket<NekoSocket>).innerType() : socket;
        return socketType instanceof OptionalInputSocket || new this.innerType().isCompatibleWith(socketType);
    }
}
