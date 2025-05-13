import { Outlet } from 'react-router-dom';
import SidePanel from '../components/SidePanel';

export default function MainPage() {
    return (
        <div className="main-page">
            <SidePanel />

            <main>
                <Outlet />
            </main>
        </div>
    );
}
