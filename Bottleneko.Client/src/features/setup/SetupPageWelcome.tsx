import wearyCatFace from '@netbek/noto-emoji/build/svg/u1f640.svg';
import { ProgressBar } from 'react-bootstrap';
import FullscreenPage from '../../components/FullscreenPage';
import { branding } from '../../props';
import { SetupStage } from './SetupPageView';

export default function SetupPageWelcome({ progress, setStage }: { progress: number; setStage: (stage: SetupStage) => void }) {
    return (
        <FullscreenPage
            title={`Welcome to ${branding.plain}!`}
            buttons={[
                { key: 'next', content: 'Next', variant: 'primary', disabled: false, action: () => {
                    setStage({ stage: 'account' });
                } },
            ]}
        >
            <div>
                <ProgressBar striped variant="success" now={progress} />

                <hr />

                <p style={{ textAlign: 'center' }}><img src={wearyCatFace} style={{ width: '6em', height: '6em' }} /></p>
                <p>
                    It seems like you haven&apos;t configured
                    {' '}
                    <strong>{branding.plain}</strong>
                    {' '}
                    yet. This wizard will guide you through the initial setup process.
                </p>
                <p>Don&apos;t worry; it won&apos;t take long!</p>
            </div>
        </FullscreenPage>
    );
}
