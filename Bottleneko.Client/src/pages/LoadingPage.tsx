import FullscreenPage from '../components/FullscreenPage';
import LoadingBanner from '../components/LoadingBanner';
import { branding } from '../props';

export default function LoadingPage() {
    return (
        <FullscreenPage title={`Connecting to ${branding.plain}...`}>
            <div style={{ height: '10rem' }}>
                <LoadingBanner size="xl" />
            </div>
        </FullscreenPage>
    );
}
