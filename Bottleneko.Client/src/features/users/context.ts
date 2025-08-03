import { createContext, useContext } from 'react';
import { UserDto } from '../api/dtos.gen';
import { EntityConfig, EntityContextData } from '../../app/EntityProvider';
import api from '../api';
import { UserState } from './UsersProvider';

interface ExtraActions {
    add: typeof api.users.add;
}

export type UserEntityConfig = EntityConfig<UserDto, Parameters<typeof api.users.update>[1], UserState>;
export type UsersContextType = EntityContextData<UserEntityConfig> & { actions: ExtraActions };

export const UsersContext = createContext<UsersContextType | null>(null);

export const useUsers = () => useContext(UsersContext);
