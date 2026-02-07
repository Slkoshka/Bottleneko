import type { ScriptCode } from '$lib/api/bottleneko.gen';
import bindingsArchive from '$lib/script_bindings.zip?url';
import * as zip from '@zip.js/zip.js';
import { Mutex } from 'async-mutex';

export interface Props {
    initialCode?: string;
    onchange?: (code: ScriptCode) => void;
}

const mutex = new Mutex();
let bindings: Map<string, string> | null = null;

export const getBindings = async () => {
    const release = await mutex.acquire();

    try {
        if (bindings !== null) {
            return bindings;
        }

        bindings = new Map<string, string>();

        const bindingsBlob = await (await fetch(bindingsArchive)).blob();
        const bindingsZip = new zip.ZipReader(new zip.BlobReader(bindingsBlob));
        const bindingsEntries = await bindingsZip.getEntries();

        const decoder = new TextDecoder('utf8');
        for (const entry of bindingsEntries.filter((entry) => !entry.directory)) {
            bindings.set(entry.filename, decoder.decode(await entry.arrayBuffer()));
        }

        return bindings;
    } finally {
        release();
    }
}
