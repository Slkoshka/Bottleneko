import { ReactNode, useCallback } from 'react';
import api from '../api';
import { UserDto } from '../api/dtos.gen';
import { EntityState, useEntityProvider } from '../../app/EntityProvider';
import { UsersContext, UserEntityConfig } from './context';

export class UserState extends EntityState<UserDto, Parameters<typeof api.users.update>[1]> {
    get info() {
        return {
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
        };
    }
}

export default function UsersProvider({ children }: { children?: ReactNode | undefined }) {
    const factory = useCallback((entity: UserDto, updated: () => void) => new UserState(api.users, entity, updated), []);
    const { data } = useEntityProvider<UserEntityConfig>('user', api.users, factory);

    const add = useCallback(async (parameters: Parameters<typeof api.users.add>[0]) => {
        const result = await api.users.add(parameters);
        data.actions.added(result.result);
        return result;
    }, [data]);

    return (
        <UsersContext.Provider
            value={{
                ...data,
                actions: {
                    add,
                    ...data.actions,
                },
            }}
        >
            {children}
        </UsersContext.Provider>
    );
};
