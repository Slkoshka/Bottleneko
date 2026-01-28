import { v4 as uuidv4 } from 'uuid';
import {
    type Packet,
    type Letter,
    type RpcResponse,
    type RpcRequest,
    type ChatMessageLetter,
    type ChatMessageFilter,
    type SubscriptionId,
    type LogLetter,
    type LogFilter,
} from '$lib/api/bottleneko.gen';
import { authState } from '../auth.svelte';
import { onDestroy } from 'svelte';
import deepEqual from 'deep-equal';
import { SvelteMap } from 'svelte/reactivity';
import AbstractRpc, { type ResultType } from '$lib/api/rpc.gen';

export const state = $state({
    connection: null as WebSocketConnection | null,
});

export type SubscriptionMailCallback = (letters: Letter[]) => void;

interface SubscriptionState {
    id: SubscriptionId | null;
    destroyed: boolean;
    connectionId: number;
    callback: SubscriptionMailCallback;
    onDisconnect: () => void;
    subscribe: () => void;
    unsubscribe: () => void;
}

export class WebSocketConnection extends AbstractRpc {
    private socket: WebSocket;
    private connectionId: number = 0;
    private inProgress = new SvelteMap<
        string,
        { resolve: (response: RpcResponse) => void; reject: (err: unknown) => void }
    >();
    private subscriptions: SubscriptionState[] = [];
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private destroyed = false;

    constructor(private path: string = '/ws') {
        super();

        this.socket = new WebSocket(path);
        this.toggleEventListeners(true);
    }

    async call<T extends RpcResponse>(request: RpcRequest): Promise<ResultType<T, void>> {
        const requestId = uuidv4();

        this.send({
            $type: 'Request',
            requestId,
            request,
        });

        return new Promise<ResultType<T, void>>((resolve, reject) => {
            this.inProgress.set(requestId, {
                resolve: (response) => {
                    resolve((response as unknown as { result: ResultType<T, undefined> }).result);
                },
                reject,
            });
        });
    }

    private send(data: Packet) {
        if (!this.destroyed && authState.data.status === 'logged-in' && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
        }
    }

    private toggleEventListeners(state: boolean) {
        if (state) {
            this.socket.addEventListener('open', this.onOpen.bind(this));
            this.socket.addEventListener('message', this.onMessage.bind(this));
            this.socket.addEventListener('close', this.onClose.bind(this));
        } else {
            this.socket.removeEventListener('open', this.onOpen.bind(this));
            this.socket.removeEventListener('message', this.onMessage.bind(this));
            this.socket.removeEventListener('close', this.onClose.bind(this));
        }
    }

    subscribe(
        callback: SubscriptionMailCallback,
        onDisconnect: () => void,
        doSubscribe: () => Promise<SubscriptionId | null>,
        doUnsubscribe: (subscriptionId: SubscriptionId) => Promise<void>,
    ): () => void {
        const subscriptionState: SubscriptionState = {
            id: null,
            destroyed: false,
            connectionId: this.connectionId,
            callback,
            onDisconnect,
            subscribe: () => {
                void (async () => {
                    if (this.socket.readyState === WebSocket.OPEN) {
                        const id = await doSubscribe();

                        if (subscriptionState.destroyed) {
                            if (id !== null && subscriptionState.connectionId === this.connectionId) {
                                void doUnsubscribe(id);
                            }
                        } else {
                            subscriptionState.id = id;
                        }
                    }
                })();
            },
            unsubscribe: () => {
                subscriptionState.destroyed = true;
                if (
                    subscriptionState.id !== null &&
                    subscriptionState.connectionId === this.connectionId &&
                    this.socket.readyState === WebSocket.OPEN
                ) {
                    void doUnsubscribe(subscriptionState.id);
                }
                subscriptionState.id = null;
            },
        };

        this.subscriptions.push(subscriptionState);
        subscriptionState.subscribe();

        return subscriptionState.unsubscribe;
    }

    private onOpen() {
        console.log('WebSocket:', 'Connected');
        if (!this.destroyed && authState.data.status === 'logged-in') {
            this.send({ $type: 'Authenticate', clientType: 'Api', accessToken: authState.data.accessToken });
            for (const subscription of this.subscriptions.values()) {
                subscription.subscribe();
            }
        } else {
            this.disconnect();
        }
    }

    private onMessage(event: MessageEvent) {
        if (!this.destroyed && authState.data.status === 'logged-in') {
            if (typeof event.data === 'string') {
                const packet = JSON.parse(event.data) as Packet;
                switch (packet.$type) {
                    case 'Response': {
                        const request = this.inProgress.get(packet.requestId);
                        if (request !== undefined) {
                            if (packet.result.$type === 'Success') {
                                request.resolve(packet.result.data);
                            } else {
                                request.reject(packet.result.message);
                            }
                        }
                        break;
                    }

                    case 'Mail':
                        for (const subscription of this.subscriptions) {
                            if (deepEqual(subscription.id, packet.subscriptionId)) {
                                subscription.callback(packet.letters);
                                break;
                            }
                        }
                        break;
                }
            }
        } else {
            this.disconnect();
        }
    }

    private onClose(event: CloseEvent) {
        console.log('WebSocket:', `Disconnected (${event.code.toString()})`);
        this.toggleEventListeners(false);

        for (const subscription of this.subscriptions) {
            subscription.onDisconnect();
        }

        if (!this.destroyed && authState.data.status === 'logged-in') {
            this.reconnectTimer = setTimeout(() => {
                this.socket = new WebSocket(this.path);
                this.toggleEventListeners(true);
            }, 3000);
        }
    }

    disconnect() {
        this.socket.close();
    }

    private destroy() {
        this.disconnect();
        this.subscriptions = [];
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
            this.destroyed = true;
        }
    }

    static factory() {
        state.connection = new WebSocketConnection();

        return {
            destroy() {
                state.connection?.destroy();
                state.connection = null;
            },
        };
    }
}

abstract class Subscriber<T extends Letter, SubscribeArgs extends unknown[]> {
    private args: SubscribeArgs | null = null;
    private doDestroy: (() => void) | null = null;
    private _mail: T[] = $state([]);
    private _isLoading: boolean = $state(true);

    get mail() {
        return this._mail;
    }
    get isLoading() {
        return this._isLoading;
    }

    constructor(private maxLetters: number = 250) {
        onDestroy(() => {
            this.destroy();
        });
    }

    subscribe(...args: SubscribeArgs) {
        if (deepEqual(args, this.args)) {
            return;
        }
        this.args = args;

        if (this.doDestroy !== null) {
            this.doDestroy();
        }

        this._isLoading = true;
        this._mail = [];

        this.doDestroy =
            state.connection?.subscribe(
                (letters) => {
                    if (letters.length === 0) {
                        this._isLoading = false;
                    } else {
                        this._mail = [...(letters as T[]), ...this._mail].slice(0, this.maxLetters);
                    }
                },
                () => {
                    this._isLoading = true;
                    this._mail = [];
                },
                () => {
                    return this.doSubscribe(...args);
                },
                (subscriptionId) => {
                    return this.doUnsubscribe(subscriptionId);
                },
            ) ?? null;
    }

    protected abstract doSubscribe(...args: SubscribeArgs): Promise<SubscriptionId | null>;
    protected abstract doUnsubscribe(subscriptionId: SubscriptionId): Promise<void>;

    private destroy() {
        this.doDestroy?.();
    }
}

export class LogSubscriber extends Subscriber<LogLetter, [LogFilter]> {
    protected override async doSubscribe(filter: LogFilter) {
        return (await state.connection?.logging.subscribe({ filter })) ?? null;
    }

    protected override async doUnsubscribe(subscriptionId: SubscriptionId) {
        await state.connection?.logging.unsubscribe({ subscriptionId });
    }
}

export class ChatMessagesSubscriber extends Subscriber<ChatMessageLetter, [ChatMessageFilter]> {
    protected override async doSubscribe(filter: ChatMessageFilter) {
        return (await state.connection?.messages.subscribe({ filter })) ?? null;
    }

    protected override async doUnsubscribe(subscriptionId: SubscriptionId) {
        await state.connection?.messages.unsubscribe({ subscriptionId });
    }
}
