import deepEqual from 'deep-equal';
import { ClassicPreset } from 'rete';

export interface NekoSocketType { id: string }

type TrivialSocket = new () => NekoSocket;

export abstract class NekoSocket<T extends NekoSocketType = NekoSocketType> extends ClassicPreset.Socket {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(readonly type: T, name: string, private readonly compatibleSockets?: any[]) {
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

    static fromType(type: NekoSocketType): NekoSocket {
        if (type.id === 'optional') {
            const optionalType = type as OptionalSocket['type'];
            return new OptionalSocket(() => this.fromType(optionalType.inner));
        }
        else {
            return socketTypes.map(socket => new (socket === OptionalSocket ? InvalidSocket : socket as TrivialSocket)()).find(socket => deepEqual(socket.type, type)) ?? new InvalidSocket();
        }
    }
}

export class InvalidSocket extends NekoSocket {
    constructor() { super({ id: 'invalid' }, 'Error', []); }
}

export abstract class SplittableObjectSocket<T extends NekoSocketType = NekoSocketType> extends NekoSocket<T> {
    constructor(type: T, name: string, compatibleSockets?: unknown[]) {
        super(type, `[Structure] ${name}`, [...(compatibleSockets ?? []), SplittableInputSocket]);
    }

    parts(): { id: string; name: string; constructor: () => NekoSocket; singleConnection?: boolean }[] {
        return [];
    }
}

export abstract class SwitchableObjectSocket<T extends NekoSocketType = NekoSocketType> extends NekoSocket<T> {
    constructor(type: T, name: string, compatibleSockets?: unknown[]) {
        super(type, `[Enum] ${name}`, [...(compatibleSockets ?? []), SwitchableInputSocket]);
    }

    options(): { id: string; name: string }[] {
        return [];
    }
}

export class ExecSocket extends NekoSocket {
    constructor() { super({ id: 'exec' }, 'Execution Flow', [ExecSocket]); }
}

export class BooleanSocket extends SwitchableObjectSocket {
    constructor() { super({ id: 'boolean' }, 'Boolean (true or false)', [BooleanSocket, StringSocket, NumberSocket]); }

    options() {
        return [
            { id: 'true', name: 'True' },
            { id: 'false', name: 'False' },
        ];
    }
}

export class NumberSocket extends NekoSocket {
    constructor() { super({ id: 'number' }, 'Number', [NumberSocket, StringSocket]); }
}

export class StringSocket extends NekoSocket {
    constructor() { super({ id: 'string' }, 'Text', [StringSocket]); }
}

export class IdSocket extends NekoSocket {
    constructor() { super({ id: 'id' }, 'ID', [IdSocket, StringSocket]); }
}

export class ProtocolSocket extends SwitchableObjectSocket {
    constructor() { super({ id: 'protocol' }, 'Protocol', [ProtocolSocket, StringSocket]); }

    options() {
        return [
            { id: 'discord', name: 'Discord' },
            { id: 'telegram', name: 'Telegram' },
            { id: 'twitch', name: 'Twitch' },
        ];
    }
}

export class TimestampSocket extends NekoSocket {
    constructor() { super({ id: 'timestamp' }, 'Timestamp', [TimestampSocket, StringSocket]); }
}

export class ChatSocket extends NekoSocket {
    constructor() { super({ id: 'chat' }, 'Chat', [ChatSocket]); }
}

export class ChatMessageSocket extends SplittableObjectSocket {
    constructor() { super({ id: 'chat-message' }, 'Chat Message', [ChatMessageSocket]); }

    parts() {
        return [
            { id: 'id', name: 'ID', constructor: () => new IdSocket() },
            { id: 'protocol', name: 'Protocol', constructor: () => new ProtocolSocket() },
            { id: 'connectionId', name: 'Connection ID', constructor: () => new IdSocket() },
            { id: 'timestamp', name: 'Timestamp', constructor: () => new TimestampSocket() },
            { id: 'chat', name: 'Chat', constructor: () => new ChatSocket() },
            { id: 'author', name: 'Author', constructor: () => new ChatterSocket() },
            { id: 'text', name: 'Text', constructor: () => new OptionalSocket(() => new StringSocket()) },
            { id: 'replyTo', name: 'Reply To', constructor: () => new OptionalSocket(() => new IdSocket()) },
        ];
    }
}

export class ChatterSocket extends NekoSocket {
    constructor() { super({ id: 'chatter' }, 'Chat User', [ChatterSocket]); }
}

export class OptionalInputSocket extends NekoSocket {
    constructor() { super({ id: 'any-optional' }, 'Any Optional Value'); }
}

export class SplittableInputSocket extends NekoSocket {
    constructor() { super({ id: 'any-splittable' }, 'Any Structure'); }
}

export class SwitchableInputSocket extends NekoSocket {
    constructor() { super({ id: 'any-switchable' }, 'Any Enum'); }
}

export class OptionalSocket extends NekoSocket<NekoSocketType & { inner: NekoSocketType }> {
    constructor(readonly innerType: () => NekoSocket) {
        super({ id: 'optional', inner: innerType().type }, `${innerType().name} (Optional)`);
    }

    isCompatibleWith(socket: ClassicPreset.Socket) {
        const socketType = socket instanceof OptionalSocket ? socket.innerType() : socket;
        return socketType instanceof OptionalInputSocket || this.innerType().isCompatibleWith(socketType);
    }
}

export const socketTypes = [
    InvalidSocket,
    ExecSocket,
    BooleanSocket,
    NumberSocket,
    StringSocket,
    IdSocket,
    ProtocolSocket,
    TimestampSocket,
    ChatSocket,
    ChatMessageSocket,
    ChatterSocket,
    OptionalInputSocket,
    SplittableInputSocket,
    SwitchableInputSocket,
    OptionalSocket,
];
