import FullscreenPage from '../components/FullscreenPage';
import { branding } from '../props';

export default function ErrorPage() {
    return (
        <FullscreenPage
            title="Error"
            titleVariant="danger"
            buttons={[
                { key: 'refresh', content: 'Refresh', disabled: false, action: () => { window.location.reload(); } },
            ]}
        >
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
        </FullscreenPage>
    );
}
