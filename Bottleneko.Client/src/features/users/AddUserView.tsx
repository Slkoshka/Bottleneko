import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from 'react-bootstrap';
import View from '../../components/views/View';
import { useAsync } from '../../app/hooks';
import UserEditor, { EditedUser } from './UserEditor';
import { useUsers } from './context';

export default function AddUserView() {
    const users = useUsers();
    const [error, setError] = useState<string | undefined>(undefined);
    const navigate = useNavigate();

    const onError = useCallback((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Unknown error');
    }, []);

    const [addUser, isLoading] = useAsync(useCallback(async (formData: EditedUser) => {
        if (!users) {
            return;
        }
        await users.actions.add({ login: formData.login, password: formData.password });
        await navigate('/users');
    }, [navigate, users]));

    const onValidated = useCallback((formData: EditedUser) => {
        addUser(formData).catch(onError);
    }, [addUser, onError]);

    return (
        <View title="Add new user">
            {
                error
                    ? (
                            <Alert variant="danger">
                                <h2 className="fs-4">Failed to create new user</h2>
                                {error}
                            </Alert>
                        )
                    : <></>
            }

            <UserEditor newUser={true} loading={isLoading} onValidated={onValidated} />
        </View>
    );
}
