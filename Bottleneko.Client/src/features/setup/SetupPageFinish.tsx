import smilingCatFaceWithOpenMouth from '@netbek/noto-emoji/build/svg/u1f63a.svg';
import FullscreenPage from '../../components/fullscreen-page/FullscreenPage';
import { useAuth } from '../auth/context';
import { branding } from '../../props';
import SetupPage from './SetupPage';

export default function SetupPageFinish({ progress }: { progress: number }) {
    const auth = useAuth();

    return (
        <SetupPage
            title="Setup completed!"
            variant="finish"
            progress={progress}
            emoji={smilingCatFaceWithOpenMouth}
        >
            <p className="fs-4 text-center">The initial setup has been completed.</p>
            <p className="fs-4 text-center">
                You&apos;re now ready to use
                {' '}
                <strong>{branding.plain}</strong>
                !
            </p>

            <FullscreenPage.Button action={() => { void auth?.actions.refreshMe(); }}>
                Finish
            </FullscreenPage.Button>
        </SetupPage>
    );
}
