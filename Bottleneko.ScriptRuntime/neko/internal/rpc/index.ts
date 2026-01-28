import { Buffer } from 'node:buffer';
import net from 'node:net';
import type { Packet, RpcRequest, RpcResponse } from '../api/bottleneko.gen.ts';
import { v4 as uuidv4 } from 'uuid';
import AbstractRpc, { type ResultType } from '../api/rpc.gen.ts';

export const MAX_SAFE_PACKET_SIZE = 1024 * 1024 * 1024; // limited by https://nodejs.org/api/stream.html#readablereadsize

export type TransportType = 'unix' | 'unixabstract' | 'namedpipes';

export default class NekoRpc extends AbstractRpc {
    #socket: net.Socket;
    #abort: AbortController;
    #onConnectionClosed: () => void
    #incomingPacketSize: number | null = null;
    #inProgress = new Map<string, { resolve: (response: RpcResponse) => void, reject: (err: unknown) => void }>();

    private constructor(socket: net.Socket, abort: AbortController, onConnectionClosed: () => void) {
        super();

        this.#socket = socket;
        this.#abort = abort;
        this.#onConnectionClosed = onConnectionClosed;

        socket.on('readable', () => this.#onReadable());
        socket.on('error', (err) => this.#onError(err));
        socket.on('close', () => this.#onClose());

        this.#onReadable();
    }

    #onError(err: Error) {
        console.error('RPC Connection error:', err.message);
    }

    #onClose() {
        this.#socket.destroy();
        this.#onConnectionClosed();
    }

    #onReadable() {
        while (true) {
            if (this.#incomingPacketSize === null) {
                const read = this.#socket.read(4) as Buffer | null;
                if (read === null || read.length !== 4) {
                    break;
                }

                this.#incomingPacketSize = (read[0] << 0) | (read[1] << 8) | (read[2] << 16) | (read[3] << 24);
            }
            else {
                const read = this.#socket.read(this.#incomingPacketSize) as Buffer | null;
                if (read === null || read.length !== this.#incomingPacketSize) {
                    break;
                }

                try {
                    const serialized = read.toString('utf8');
                    const packet = JSON.parse(serialized) as Packet;
                    if (packet.$type === 'Response') {
                        const handler = this.#inProgress.get(packet.requestId);
                        if (handler !== undefined) {
                            this.#inProgress.delete(packet.requestId);
                            if (packet.result.$type === 'Success') {
                                handler.resolve(packet.result.data);
                            }
                            else {
                                handler.reject(packet.result.message);
                            }
                        }
                    }
                    else if (packet.$type === 'Mail') {
                        this.onMail(packet);
                    }
                }
                finally {
                    this.#incomingPacketSize = null;
                }
            }
        }
    }

    override call<T extends RpcResponse>(request: RpcRequest): Promise<ResultType<T, void>> {
        const requestId = uuidv4();

        this.send({
            $type: 'Request',
            requestId,
            request,
        });

        return new Promise<ResultType<T, void>>((resolve, reject) => {
            this.#inProgress.set(requestId, {
                resolve: (response) => resolve((response as unknown as { result: ResultType<T, undefined> }).result),
                reject,
            });
        });
    }

    async send(data: Packet) {
        await new Promise<void>((resolve, reject) => {
            const serializedString = JSON.stringify(data);
            const serialized = Buffer.from(serializedString, 'utf8');

            if (serialized.length > MAX_SAFE_PACKET_SIZE) {
                throw 'Packet is too big';
            }

            const packet = new Uint8Array(4 + serialized.length);

            packet[0] = (serialized.length & 0x000000FF) >> 0;
            packet[1] = (serialized.length & 0x0000FF00) >> 8;
            packet[2] = (serialized.length & 0x00FF0000) >> 16;
            packet[3] = (serialized.length & 0xFF000000) >> 24;
            serialized.copy(packet, 4);

            this.#socket.write(packet, (err) =>
            {
                if (err === null)
                {
                    resolve();
                }
                else
                {
                    reject(err);
                }
            });
        });
    }

    static async create(transportType: TransportType, name: string, onConnectionClosed: () => void): Promise<{ rpc: NekoRpc; destroy: () => void }> {
        let path;

        switch (transportType) {
            case 'unix':
                path = name;
                break;

            case 'unixabstract':
                path = `\0${name}`;
                break;

            case 'namedpipes':
                path = `\\\\?\\${name}`;
                break;

            default:
                throw `Invalid transport: '${transportType}'`;
        }

        const abort = new AbortController();
        const rpc = await new Promise<NekoRpc>((resolve) => {
            const socket = net.createConnection({
                path,
                signal: abort.signal,
            }, () => resolve(new NekoRpc(socket, abort, onConnectionClosed)));
        });
        return { rpc, destroy: () => rpc.#destroy() };
    }

    #destroy() {
        this.#abort.abort();
    }
}
