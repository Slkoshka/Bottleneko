import { type UserDto } from '../../api/bottleneko.gen';
import api from '$lib/api';
import { EntityProvider, LocalEntity } from '$lib/provider.svelte';

export class LocalUser extends LocalEntity<
    UserDto,
    Parameters<typeof api.users.add>[0],
    Parameters<typeof api.users.update>[1]
> {
    override canDelete = true;
    info = $derived({
        id: {
            name: 'ID',
            value: this.data.id,
        },
        login: {
            name: 'Username',
            value: this.data.login,
        },
        type: {
            name: 'Display Name',
            value: this.data.displayName,
        },
    });

    constructor(user: UserDto) {
        super(api.users, user);
    }
}

export class UsersProvider extends EntityProvider<
    UserDto,
    Parameters<typeof api.users.add>[0],
    Parameters<typeof api.users.update>[1],
    LocalUser
> {
    constructor() {
        super(api.users, (user) => new LocalUser(user));
    }

    destroy() {
        super.destroy();
    }
}
