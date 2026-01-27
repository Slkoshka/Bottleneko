import { v4 as uuidv4 } from 'uuid';
import { type Packet, type SubscriptionTopic, type Letter } from '$lib/api/bottleneko.gen';
import { authState } from '../auth.svelte';
import { onDestroy } from 'svelte';
import deepEqual from 'deep-equal';
import { SvelteMap } from 'svelte/reactivity';

export const state = $state({
    connection: null as WebSocketConnection | null,
});

export type SubscriptionMailCallback = (letters: Letter[]) => void;
export interface Subscription {
    id: string;
    destroy: () => void;
}

export class WebSocketConnection {
    private socket: WebSocket;
    private subscriptions = new SvelteMap<
        string,
        {
            callback: SubscriptionMailCallback;
            onDisconnect: () => void;
            topic: SubscriptionTopic;
            beforeId: string | null;
        }
    >();
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private destroyed = false;

    constructor(private path: string = '/ws') {
        this.socket = new WebSocket(path);
        this.toggleEventListeners(true);
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

    private send(data: Packet) {
        if (!this.destroyed && authState.data.status === 'logged-in' && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
        }
    }

    subscribe(
        callback: SubscriptionMailCallback,
        onDisconnect: () => void,
        topic: SubscriptionTopic,
        beforeId: string | null = null,
    ): Subscription {
        const id = uuidv4();
        this.subscriptions.set(id, { callback, onDisconnect, topic, beforeId });

        if (this.socket.readyState === WebSocket.OPEN) {
            this.send({
                $type: 'Subscribe',
                id,
                topic,
                beforeId,
            });
        }

        return {
            id,
            destroy: () => {
                if (this.subscriptions.has(id)) {
                    this.subscriptions.delete(id);
                    if (this.socket.readyState === WebSocket.OPEN) {
                        this.send({
                            $type: 'Unsubscribe',
                            id,
                        });
                    }
                }
            },
        };
    }

    private onOpen() {
        console.log('WebSocket:', 'Connected');
        if (!this.destroyed && authState.data.status === 'logged-in') {
            this.send({ $type: 'Authenticate', accessToken: authState.data.accessToken });
            for (const [id, subscription] of this.subscriptions.entries()) {
                this.send({
                    $type: 'Subscribe',
                    id,
                    topic: subscription.topic,
                    beforeId: subscription.beforeId,
                });
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
                    case 'Mail':
                        this.subscriptions.get(packet.subscriptionId)?.callback(packet.letters);
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
        this.subscriptions.clear();
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

export interface SubscriptionOptions<T extends Letter['$type']> {
    topic: SubscriptionTopic & { $type: `${T}s` };
    beforeId?: string;
    maxMessages?: number;
}

export class Subscriber<T extends Letter> {
    private subscription: Subscription | null = null;
    private options: SubscriptionOptions<T['$type']> | null = null;
    _mail: T[] = $state([]);
    _isLoading: boolean = $state(true);

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

    subscribe(options: SubscriptionOptions<T['$type']>) {
        if (deepEqual(options, this.options)) {
            return;
        }

        this.options = options;
        this.subscription?.destroy();
        this._isLoading = true;
        this._mail = [];

        this.subscription =
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
                options.topic,
                options.beforeId,
            ) ?? null;
    }

    private destroy() {
        this.subscription?.destroy();
    }
}
