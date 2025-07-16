import FullscreenPage from '../components/fullscreen-page/FullscreenPage';
import LoadingBanner from '../components/LoadingBanner';
import { branding } from '../props';

export default function LoadingPage() {
    return (
        <FullscreenPage>
            <FullscreenPage.Title>
                {`Connecting to ${branding.plain}...`}
            </FullscreenPage.Title>

            <div style={{ height: '10rem' }}>
                <LoadingBanner size="xl" />
            </div>
        </FullscreenPage>
    );
}
