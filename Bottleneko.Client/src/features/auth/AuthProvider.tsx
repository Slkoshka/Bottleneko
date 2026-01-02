import { ReactNode, useCallback, useEffect, useState } from 'react';
import api from '../api';
import { RequestError } from '../api/errors';
import { ErrorCode } from '../api/responses';
import { UserDto } from '../api/dtos.gen';
import { useOnce } from '../../app/hooks';
import { AppStatus, AuthContext } from './context';
import { storageAccessTokenKey } from '.';

const AuthProvider = ({ children }: { children?: ReactNode | undefined }) => {
    const [status, setStatus] = useState<AppStatus>('loading');
    const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem(storageAccessTokenKey));
    const [me, setMe] = useState<UserDto | null>(null);

    const refreshMe = async () => {
        try {
            setMe(await api.users.getMe());
            setStatus('logged-in');
        }
        catch (err) {
            if (err instanceof RequestError) {
                switch (err.code) {
                    case ErrorCode.Unauthorized:
                        setStatus('login-required');
                        break;

                    case ErrorCode.SetupRequired:
                        setStatus('setup-required');
                        break;

                    default:
                        setStatus('error');
                        break;
                }
            }
            else {
                setStatus('error');
            }
        }
    };

    useOnce(() => void refreshMe());

    useEffect(() => {
        if (accessToken) {
            localStorage.setItem(storageAccessTokenKey, accessToken);
        }
        else {
            localStorage.removeItem(storageAccessTokenKey);
        }
    }, [accessToken]);

    const logout = useCallback(() => {
        setAccessToken(null);

        if (status !== 'setup-required') {
            setStatus('login-required');
        }
    }, [status]);

    const value = {
        state: {
            status,
            accessToken,
            me,
        },
        actions: {
            refreshMe,
            setStatus,
            logout,
        },
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
