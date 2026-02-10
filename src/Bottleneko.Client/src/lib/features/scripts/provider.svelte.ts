import { type ScriptDto } from '../../api/bottleneko.gen';
import api from '$lib/api';
import { EntityProvider, LocalEntity } from '$lib/provider.svelte';

export const state = $state({
    provider: null as ScriptsProvider | null,
});

export class LocalScript extends LocalEntity<
    ScriptDto,
    Parameters<typeof api.scripts.add>[0],
    Parameters<typeof api.scripts.update>[1]
> {
    override canStart = $derived(!this.isLoading && (this.data.status === 'Stopped' || this.data.status === 'Error'));
    override canRestart = $derived(
        !this.isLoading &&
            this.data.status !== 'Stopped' &&
            this.data.status !== 'Stopping' &&
            this.data.status !== 'Error',
    );
    override canStop = $derived(
        !this.isLoading &&
            this.data.status !== 'Stopped' &&
            this.data.status !== 'Stopping' &&
            this.data.status !== 'Error',
    );
    override canDelete = true;
    info = $derived({
        id: {
            name: 'ID',
            value: this.data.id,
        },
        name: {
            name: 'Name',
            value: this.data.name,
        },
        description: {
            name: 'Description',
            value: this.data.description === '' ? '(no description)' : this.data.description,
        },
    });

    constructor(script: ScriptDto) {
        super(api.scripts, script);
    }

    async setAutoStart(isEnabled: boolean) {
        await this.update({ autoStart: isEnabled });
    }

    override async start() {
        await this.asyncOp(
            async () => {
                await api.scripts.start(this.data.id);
            },
            'starting',
            true,
        );
    }

    override async restart() {
        await this.asyncOp(
            async () => {
                await api.scripts.restart(this.data.id);
            },
            'restarting',
            true,
        );
    }

    override async stop() {
        await this.asyncOp(
            async () => {
                await api.scripts.stop(this.data.id);
            },
            'stopping',
            true,
        );
    }
}

export class ScriptsProvider extends EntityProvider<
    ScriptDto,
    Parameters<typeof api.scripts.add>[0],
    Parameters<typeof api.scripts.update>[1],
    LocalScript
> {
    constructor() {
        super(api.scripts, (script) => new LocalScript(script));
    }

    static factory() {
        state.provider = new ScriptsProvider();

        return {
            destroy() {
                state.provider?.destroy();
                state.provider = null;
            },
        };
    }
}
