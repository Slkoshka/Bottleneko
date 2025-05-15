import { createBrowserRouter } from 'react-router-dom';
import MainPage from '../pages/MainPage';
import DashboardView from '../features/dashboard/DashboardView';
import ConnectionsView from '../features/connections/ConnectionsView';
import AddConnectionView from '../features/connections/add-wizard/AddConnectionView';
import ConnectionView from '../features/connections/ConnectionView';
import UsersView from '../features/users/UsersView';
import AddUserView from '../features/users/AddUserView';
import UserView from '../features/users/UserView';
import SettingsView from '../features/settings/SettingsView';
import ScriptsView from '../features/scripts/ScriptsView';
import AddScriptView from '../features/scripts/AddScriptView';
import ScriptView from '../features/scripts/ScriptView';
import MessagesView from '../features/messages/MessagesView';
import NotFoundPage from '../pages/NotFoundPage';

const router = createBrowserRouter([
    {
        path: '/',
        element: <MainPage />,
        children: [
            {
                index: true,
                element: <DashboardView />,
            },

            {
                path: 'messages',
                element: <MessagesView />,
            },

            {
                path: 'connections',
                element: <ConnectionsView />,
            },
            {
                path: 'connections/add',
                element: <AddConnectionView />,
            },
            {
                path: 'connections/:connectionId',
                element: <ConnectionView />,
            },

            {
                path: 'users',
                element: <UsersView />,
            },
            {
                path: 'users/add',
                element: <AddUserView />,
            },
            {
                path: 'users/:userId',
                element: <UserView />,
            },

            {
                path: 'scripts',
                element: <ScriptsView />,
            },
            {
                path: 'scripts/add',
                element: <AddScriptView />,
            },
            {
                path: 'scripts/:scriptId',
                element: <ScriptView />,
            },

            {
                path: 'settings',
                element: <SettingsView />,
            },
        ],
    },
    {
        path: '*',
        element: <NotFoundPage />,
    },
]);

export default router;
