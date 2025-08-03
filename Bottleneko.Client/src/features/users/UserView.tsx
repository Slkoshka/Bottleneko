import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Alert } from 'react-bootstrap';
import api from '../api';
import View from '../../components/views/View';
import { useAuth } from '../auth/context';
import { useEntityEditor } from '../../app/hooks';
import UserEditor, { EditedUser } from './UserEditor';
import { UserEntityConfig, useUsers } from './context';

export default function UserView() {
    const users = useUsers();
    const { userId } = useParams();
    const auth = useAuth();
    const { state, notFound, save, isSaving } = useEntityEditor<UserEntityConfig>(userId, api.users, users);

    const onValidated = useCallback(async (formData: EditedUser) => {
        await save({ login: formData.login, password: formData.password === '' ? undefined : formData.password });
        if (userId === auth?.state.me?.id) {
            await auth?.actions.refreshMe();
        }
    }, [save, auth, userId]);

    if (notFound) {
        return (
            <View title="Not found">
                <Alert variant="warning" style={{ maxWidth: '600px' }}>
                    <span className="fs-5">The user does not exist or has been deleted.</span>
                </Alert>
            </View>
        );
    }

    return (
        <View title={!state ? 'Loading...' : state.data.displayName} loading={state ? state.isLoading : true} fillScreen>
            <UserEditor newUser={false} loading={isSaving} user={state?.data} onValidated={(formData) => { void onValidated(formData); }} />
        </View>
    );
}
