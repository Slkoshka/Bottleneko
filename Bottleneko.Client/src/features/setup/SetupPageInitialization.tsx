import { useCallback, useState } from 'react';
import Highlight from 'react-highlight';
import FullscreenPage from '../../components/fullscreen-page/FullscreenPage';
import { useAsync, useOnce } from '../../app/hooks';
import api from '../api';
import LoadingBanner from '../../components/LoadingBanner';
import { saveAccessToken } from '../auth';
import { ErrorMetadata, extractErrorInfo } from '../../app/utils';
import { SetupStage } from './SetupPageView';
import SetupPage from './SetupPage';

export default function SetupPageInitialization({ progress, account, setStage }: { progress: number; account: { login: string; password: string }; setStage: (stage: SetupStage) => void }) {
    const [error, setError] = useState<ErrorMetadata | null>();

    const onError = useCallback((err: unknown) => {
        setError(extractErrorInfo(err));
    }, []);

    const [setup, isLoading] = useAsync(useCallback(async () => {
        await api.system.setup(account.login, account.password);
        saveAccessToken((await api.users.login(account.login, account.password)).accessToken);
        setStage({ stage: 'finish' });
    }, [account.login, account.password, setStage]));

    useOnce(() => {
        void setup().catch(onError);
    });

    return (
        <SetupPage
            title={error ? 'An error has occured' : 'Setting up...'}
            variant={error ? 'error' : 'working'}
            progress={progress}
        >
            {
                error
                    ? (
                            <p>
                                <Highlight className="json">{JSON.stringify(error, null, 2)}</Highlight>
                            </p>
                        )
                    : isLoading ? <LoadingBanner /> : <></>
            }

            <FullscreenPage.Button disabled>
                Next
            </FullscreenPage.Button>
        </SetupPage>
    );
}
