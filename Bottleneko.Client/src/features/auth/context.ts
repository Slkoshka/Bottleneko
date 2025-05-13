import { createContext, useContext } from 'react';
import { UserDto } from '../api/dtos.gen';

export type AppStatus = 'loading' | 'logged-in' | 'login-required' | 'setup-required' | 'error';

export interface AuthContextType {
    state: {
        me: UserDto | null;
        accessToken: string | null;
        status: AppStatus;
    };
    actions: {
        refreshMe: () => Promise<void>;
        setStatus: (status: AppStatus) => void;
        logout: () => void;
    };
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => useContext(AuthContext);
