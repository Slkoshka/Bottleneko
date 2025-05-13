import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import View from '../../components/View';
import { useAuth } from '../auth/context';
import { useAsync, useFetchData } from '../../app/hooks';
import { useToasterDispatch } from '../toaster/context';
import UserEditor, { EditedUser } from './UserEditor';

export default function UserView() {
    const { userId } = useParams();
    const fetchUser = useCallback((signal: AbortSignal) => api.users.get(userId ?? '', signal), [userId]);
    const [user, isLoading, refresh] = useFetchData(fetchUser);
    const auth = useAuth();
    const toasterDispatch = useToasterDispatch();

    const onError = useCallback((err: unknown) => {
        toasterDispatch?.({ action: 'show', toast: { variant: 'danger', title: 'Failed to save', text: err instanceof Error ? err.message : 'Unknown error' } });
    }, [toasterDispatch]);

    const [save, isSaving] = useAsync(useCallback(async (formData: EditedUser) => {
        if (!userId) {
            return;
        }

        await api.users.update(userId, formData.login, formData.password === '' ? null : formData.password);
        if (userId === auth?.state.me?.id) {
            await auth.actions.refreshMe();
        }
        refresh();
    }, [auth, refresh, userId]));

    const onValidated = useCallback((formData: EditedUser) => {
        save(formData).catch(onError);
    }, [save, onError]);

    return (
        <View title={isLoading ? 'Loading...' : user?.displayName}>
            {
                isLoading
                    ? <></>
                    : <UserEditor newUser={false} loading={isSaving} user={user ?? undefined} onValidated={(formData) => { onValidated(formData); }} />
            }
        </View>
    );
}
