import { ReactNode } from 'react';
import { ProgressBar } from 'react-bootstrap';
import FullscreenPage from '../../components/fullscreen-page/FullscreenPage';

type SetupPageVariant = 'normal' | 'working' | 'error' | 'finish';

export default function SetupPage({ title, variant, progress, emoji, children }: { title: ReactNode; variant: SetupPageVariant; progress: number; emoji?: string; children: ReactNode[] | ReactNode }) {
    return (
        <FullscreenPage>
            <FullscreenPage.Title variant={variant === 'error' ? 'danger' : 'primary'}>
                {title}
            </FullscreenPage.Title>

            <ProgressBar animated={variant === 'working'} striped={variant !== 'error' && variant !== 'finish'} variant={variant === 'error' ? 'danger' : 'success'} now={variant === 'error' ? 100 : progress} />

            <hr />

            {
                emoji
                    ? <p style={{ textAlign: 'center' }}><img src={emoji} style={{ width: '6em', height: '6em' }} /></p>
                    : <></>
            }

            {...(Array.isArray(children) ? children : [children])}
        </FullscreenPage>
    );
}
