import { Button, Table } from 'react-bootstrap';
import { useCallback, useState } from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import api from '../api';
import View from '../../components/View';
import { useAuth } from '../auth/context';
import { useAsync, useFetchData } from '../../app/hooks';
import { UserDto } from '../api/dtos.gen';
import DeleteConfirmationDialog from '../../components/DeleteConfirmationDialog';

const fetchUsers = (signal: AbortSignal) => api.users.list(signal).then(response => response.users);

export default function UsersView() {
    const [users, usersLoading, refreshUsers] = useFetchData(fetchUsers);
    const [deletingUser, setDeletingUser] = useState<UserDto | undefined>(undefined);
    const auth = useAuth();

    const [deleteUser, isUpdating] = useAsync(useCallback(async () => {
        if (deletingUser) {
            try {
                await api.users.delete(deletingUser.id);
                refreshUsers();
            }
            finally {
                setDeletingUser(undefined);
            }
        }
    }, [deletingUser, refreshUsers]));

    const getUserInfo = (user: UserDto) => {
        return {
            id: {
                name: 'ID',
                value: user.id,
            },
            name: {
                name: 'Username',
                value: user.login,
            },
            description: {
                name: 'Display Name',
                value: user.displayName,
            },
        };
    };

    const isLoading = usersLoading || isUpdating;

    return (
        <View title="Users" loading={isLoading}>
            <DeleteConfirmationDialog
                item={deletingUser}
                itemTypeName="user"
                onDelete={() => { void deleteUser(); }}
                onCancel={() => { setDeletingUser(undefined); }}
                itemInfoBuilder={getUserInfo}
            />

            <Table striped style={{ tableLayout: 'fixed', minWidth: '40em' }} responsive>
                <thead>
                    <tr>
                        <th style={{ width: '14em' }}>ID</th>
                        <th style={{ width: 'calc((100% - 14em - 9em) / 2)' }}>Username</th>
                        <th style={{ width: 'calc((100% - 14em - 9em) / 2)' }}>Display Name</th>
                        <th style={{ width: '9em' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        users
                            ? users.map(user => (
                                    <tr key={user.id}>
                                        <td className="font-monospace align-middle">{user.id}</td>
                                        <td className="font-monospace align-middle text-break">{user.login}</td>
                                        <td className="align-middle text-break">{user.displayName}</td>
                                        <td>
                                            <LinkContainer to={`/users/${user.id}`}><Button size="sm" className="mx-1" as="a">Edit</Button></LinkContainer>
                                            <Button size="sm" variant="danger" className="mx-1" disabled={user.id === auth?.state.me?.id} onClick={() => { setDeletingUser(user); }}>Delete</Button>
                                        </td>
                                    </tr>
                                ))
                            : <></>
                    }
                </tbody>
            </Table>
            <hr />
            <div className="d-flex justify-content-center w-50 mx-auto" style={{ minWidth: '300px' }}>
                <LinkContainer to="/users/add"><Button size="lg" className="mx-2" style={{ minWidth: '25%' }}>Add User</Button></LinkContainer>
            </div>
        </View>
    );
}
