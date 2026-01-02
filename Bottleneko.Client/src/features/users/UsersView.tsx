import { useCallback } from 'react';
import { Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { LinkContainer } from 'react-router-bootstrap';
import View from '../../components/views/View';
import { useAuth } from '../auth/context';
import { useEntityDeletion } from '../../app/hooks';
import { TableRow } from '../../components/table';
import { HamburgerMenu } from '../../components/HamburgerMenu';
import InlineIcon from '../../components/InlineIcon';
import ScrollableTable from '../../components/table/ScrollableTable';
import IconButton from '../../components/IconButton';
import { UserEntityConfig, useUsers } from './context';
import { UserState } from './UsersProvider';

export default function UsersView() {
    const navigate = useNavigate();
    const users = useUsers();
    const { deleteEntity, dialog } = useEntityDeletion<UserEntityConfig>(users);
    const auth = useAuth();

    const columns = [
        { id: 'id', header: 'ID', style: { width: '5em' } },
        { id: 'login', header: 'Username' },
        { id: 'displayName', header: 'Display Name' },
        { id: 'actions', header: '', style: { width: '5em' } },
    ];

    const renderRow = useCallback((user: UserState): TableRow => ({
        id: user.data.id,
        className: 'user-list-row',
        onClick: () => { void navigate(`/users/${user.data.id}`); },
        columns: {
            id: {
                content: user.data.id,
                className: 'font-monospace',
                style: { verticalAlign: 'middle' },
            },
            login: {
                content: user.data.login,
                className: 'font-monospace',
                style: { verticalAlign: 'middle' },
            },
            displayName: {
                content: user.data.displayName,
                className: 'text-collapse',
                style: { verticalAlign: 'middle' },
            },
            actions: {
                content: (
                    <div className="w-100 d-flex justify-content-end gap-2">
                        <Dropdown>
                            <Dropdown.Toggle as={HamburgerMenu} />
                            <Dropdown.Menu>
                                <Dropdown.Item as="button" onClick={() => { void navigate(`/users/${user.data.id}`); }}>
                                    <InlineIcon icon="gear-fill" style={{ marginRight: '0.5em' }} />
                                    Edit
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item as="button" onClick={() => { deleteEntity(user); }} disabled={user.data.id === auth?.state.me?.id}>
                                    <InlineIcon icon="trash3-fill" style={{ marginRight: '0.5em' }} />
                                    Delete
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                ),
                onClick: (e) => { e.stopPropagation(); },
            },
        },
    }), [deleteEntity, navigate, auth]);

    return (
        <View title="Users" loading={!users?.state} fillScreen>
            {dialog}

            <div className="user-list h-100">
                <ScrollableTable<UserState>
                    columns={columns}
                    render={renderRow}
                    data={users?.state.list}
                    placeholder={() => <em className="text-secondary fst-italic">(no users)</em>}
                    title="User list"
                    className="entity-list"
                    highlightHeader
                >
                    <ScrollableTable.HeaderExtra position="end">
                        <LinkContainer to="/users/add">
                            <IconButton icon="plus-lg" tooltip="Create user" variant="dark" />
                        </LinkContainer>
                    </ScrollableTable.HeaderExtra>
                </ScrollableTable>
            </div>
        </View>
    );
}
