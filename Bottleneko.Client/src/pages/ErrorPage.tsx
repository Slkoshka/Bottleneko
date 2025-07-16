import FullscreenPage from '../components/fullscreen-page/FullscreenPage';
import { branding } from '../props';

export default function ErrorPage() {
    return (
        <FullscreenPage>
            <FullscreenPage.Title variant="danger">
                Error
            </FullscreenPage.Title>

            <p>
                <strong>
                    An error has occured while accessing
                    {' '}
                    {branding.plain}
                    .
                </strong>
            </p>
            <p>
                Try refreshing the page.
            </p>

            <FullscreenPage.Button action={() => { window.location.reload(); }}>
                Refresh
            </FullscreenPage.Button>
        </FullscreenPage>
    );
}
