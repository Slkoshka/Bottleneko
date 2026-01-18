import type { TwitchProtocolChannel } from '$lib/api/dtos.gen';

export interface Props {
    show: boolean;
    ['is-mine']: boolean;
    channel?: TwitchProtocolChannel;
    onsuccess?: (channel: TwitchProtocolChannel) => void;
    onclose?: () => void;
}
