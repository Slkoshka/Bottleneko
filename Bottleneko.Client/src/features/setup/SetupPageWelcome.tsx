import wearyCatFace from '@netbek/noto-emoji/build/svg/u1f640.svg';
import FullscreenPage from '../../components/fullscreen-page/FullscreenPage';
import { branding } from '../../props';
import { SetupStage } from './SetupPageView';
import SetupPage from './SetupPage';

export default function SetupPageWelcome({ progress, setStage }: { progress: number; setStage: (stage: SetupStage) => void }) {
    return (
        <SetupPage title={`Welcome to ${branding.plain}!`} variant="normal" progress={progress} emoji={wearyCatFace}>
            <p>
                It seems like you haven&apos;t configured
                {' '}
                <strong>{branding.plain}</strong>
                {' '}
                yet. This wizard will guide you through the initial setup process.
            </p>
            <p>Don&apos;t worry; it won&apos;t take long!</p>

            <FullscreenPage.Button action={() => { setStage({ stage: 'account' }); }}>
                Next
            </FullscreenPage.Button>
        </SetupPage>
    );
}
