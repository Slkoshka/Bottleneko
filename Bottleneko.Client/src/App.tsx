import './bootstrap.scss';
import 'highlight.js/styles/default.min.css';
import './App.css';

import { RouterProvider } from 'react-router-dom';
import router from './app/router';
import LoginPage from './features/auth/LoginPage';
import { useAuth } from './features/auth/context';
import AuthProvider from './features/auth/AuthProvider';
import ConnectionsProvider from './features/connections/ConnectionsProvider';
import ToasterProvider from './features/toaster/ToasterProvider';
import Toaster from './features/toaster/Toaster';
import WebSocketConnection from './features/websockets/WebSocketConnection';
import SetupPageView from './features/setup/SetupPageView';
import EventEmitterProvider from './features/events/EventEmitterProvider';
import ScriptsProvider from './features/scripts/ScriptsProvider';
import LoadingPage from './pages/LoadingPage';
import ErrorPage from './pages/ErrorPage';

function AppView() {
    const auth = useAuth();

    switch (auth?.state.status) {
        case 'logged-in':
            return (
                <ConnectionsProvider>
                    <ScriptsProvider>
                        <WebSocketConnection>
                            <RouterProvider router={router} />
                        </WebSocketConnection>
                    </ScriptsProvider>
                </ConnectionsProvider>
            );
        case 'loading':
            return <LoadingPage />;
        case 'login-required':
            return <LoginPage />;
        case 'error':
            return <ErrorPage />;
        case 'setup-required':
            return <SetupPageView />;
    }
}

export default function App() {
    return (
        <EventEmitterProvider>
            <AuthProvider>
                <ToasterProvider>
                    <Toaster />
                    <AppView />
                </ToasterProvider>
            </AuthProvider>
        </EventEmitterProvider>
    );
}
