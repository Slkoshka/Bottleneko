import deepEqual from 'deep-equal';
import { ClassicPreset } from 'rete';
import { GraphAnyEnumInputSocketType, GraphAnyOptionalInputSocketType, GraphAnyStructureInputSocketType, GraphBooleanSocketType, GraphChatMessageSocketType, GraphChatSocketType, GraphChatterSocketType, GraphExecSocketType, GraphIdSocketType, GraphInvalidSocketType, GraphNumberSocketType, GraphOptionalSocketType, GraphProtocolSocketType, GraphSocketType, GraphStringSocketType, GraphTimestampSocketType, Protocol } from '../../../api/dtos.gen';

type TrivialSocket = new () => NekoSocket;

export abstract class NekoSocket<T extends GraphSocketType = GraphSocketType> extends ClassicPreset.Socket {
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

    static fromType(type: GraphSocketType): NekoSocket {
        if (type.$type === 'optional') {
            return new OptionalSocket(() => this.fromType(type.innerType));
        }
        else {
            return socketTypes.map(socket => new (socket === OptionalSocket ? InvalidSocket : socket as TrivialSocket)()).find(socket => deepEqual(socket.type, type)) ?? new InvalidSocket();
        }
    }
}

export class InvalidSocket extends NekoSocket<GraphInvalidSocketType> {
    constructor() { super({ $type: 'invalid' }, 'Error', []); }
}

export abstract class SplittableObjectSocket<T extends GraphSocketType> extends NekoSocket<T> {
    constructor(type: T, name: string, compatibleSockets?: unknown[]) {
        super(type, `[Structure] ${name}`, [...(compatibleSockets ?? []), AnyStructureInputSocket]);
    }

    parts(): { id: string; name: string; constructor: () => NekoSocket; singleConnection?: boolean }[] {
        return [];
    }
}

export abstract class SwitchableObjectSocket<T extends GraphSocketType, Option extends string> extends NekoSocket<T> {
    constructor(type: T, name: string, compatibleSockets?: unknown[]) {
        super(type, `[Enum] ${name}`, [...(compatibleSockets ?? []), AnyEnumInputSocket]);
    }

    options(): { id: Option; name: string }[] {
        return [];
    }
}

export class ExecSocket extends NekoSocket<GraphExecSocketType> {
    constructor() { super({ $type: 'exec' }, 'Execution Flow', [ExecSocket]); }
}

export class BooleanSocket extends SwitchableObjectSocket<GraphBooleanSocketType, string> {
    constructor() { super({ $type: 'boolean' }, 'Boolean (true or false)', [BooleanSocket, StringSocket, NumberSocket]); }

    options() {
        return [
            { id: 'true', name: 'True' },
            { id: 'false', name: 'False' },
        ];
    }
}

export class NumberSocket extends NekoSocket<GraphNumberSocketType> {
    constructor() { super({ $type: 'number' }, 'Number', [NumberSocket, StringSocket]); }
}

export class StringSocket extends NekoSocket<GraphStringSocketType> {
    constructor() { super({ $type: 'string' }, 'Text', [StringSocket]); }
}

export class IdSocket extends NekoSocket<GraphIdSocketType> {
    constructor() { super({ $type: 'id' }, 'ID', [IdSocket, StringSocket]); }
}

export class ProtocolSocket extends SwitchableObjectSocket<GraphProtocolSocketType, Protocol> {
    constructor() { super({ $type: 'protocol' }, 'Protocol', [ProtocolSocket, StringSocket]); }

    options() {
        return [
            { id: Protocol.Discord, name: 'Discord' },
            { id: Protocol.Telegram, name: 'Telegram' },
            { id: Protocol.Twitch, name: 'Twitch' },
        ];
    }
}

export class TimestampSocket extends NekoSocket<GraphTimestampSocketType> {
    constructor() { super({ $type: 'timestamp' }, 'Timestamp', [TimestampSocket, StringSocket]); }
}

export class ChatSocket extends NekoSocket<GraphChatSocketType> {
    constructor() { super({ $type: 'chat' }, 'Chat', [ChatSocket]); }
}

export class ChatMessageSocket extends SplittableObjectSocket<GraphChatMessageSocketType> {
    constructor() { super({ $type: 'chat-message' }, 'Chat Message', [ChatMessageSocket]); }

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

export class ChatterSocket extends NekoSocket<GraphChatterSocketType> {
    constructor() { super({ $type: 'chatter' }, 'Chat User', [ChatterSocket]); }
}

export class OptionalInputSocket extends NekoSocket<GraphAnyOptionalInputSocketType> {
    constructor() { super({ $type: 'any-optional' }, 'Any Optional Value'); }
}

export class AnyStructureInputSocket extends NekoSocket<GraphAnyStructureInputSocketType> {
    constructor() { super({ $type: 'any-structure' }, 'Any Structure'); }
}

export class AnyEnumInputSocket extends NekoSocket<GraphAnyEnumInputSocketType> {
    constructor() { super({ $type: 'any-enum' }, 'Any Enum'); }
}

export class OptionalSocket extends NekoSocket<GraphOptionalSocketType> {
    constructor(readonly innerType: () => NekoSocket) {
        super({ $type: 'optional', innerType: innerType().type }, `${innerType().name} (Optional)`);
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
    AnyStructureInputSocket,
    AnyEnumInputSocket,
    OptionalSocket,
];
