import smilingCatFaceWithOpenMouth from '@netbek/noto-emoji/build/svg/u1f63a.svg';
import { ProgressBar } from 'react-bootstrap';
import FullscreenPage from '../../components/FullscreenPage';
import { useAuth } from '../auth/context';
import { branding } from '../../props';

export default function SetupPageFinish({ progress }: { progress: number }) {
    const auth = useAuth();

    return (
        <FullscreenPage
            title="Setup completed!"
            buttons={[
                { key: 'finish', content: 'Finish', variant: 'primary', disabled: false, action: () => {
                    void auth?.actions.refreshMe();
                } },
            ]}
        >
            <div>
                <ProgressBar variant="success" now={progress} />

                <hr />

                <p style={{ textAlign: 'center' }}><img src={smilingCatFaceWithOpenMouth} style={{ width: '6em', height: '6em' }} /></p>
                <p style={{ textAlign: 'center', fontSize: '1.5em' }}>The initial setup has been completed.</p>
                <p style={{ textAlign: 'center', fontSize: '1.5em' }}>
                    You&apos;re now ready to use
                    {' '}
                    <strong>{branding.plain}</strong>
                    !
                </p>
            </div>
        </FullscreenPage>
    );
}
