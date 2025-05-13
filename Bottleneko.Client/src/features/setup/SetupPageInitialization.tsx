import { useCallback, useState } from 'react';
import { ProgressBar } from 'react-bootstrap';
import Highlight from 'react-highlight';
import FullscreenPage from '../../components/FullscreenPage';
import { useAsync, useOnce } from '../../app/hooks';
import api from '../api';
import LoadingBanner from '../../components/LoadingBanner';
import { saveAccessToken } from '../auth';
import { ErrorMetadata, extractErrorInfo } from '../../app/utils';
import { SetupStage } from './SetupPageView';

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
        <FullscreenPage
            title={error ? 'An error has occured' : 'Setting up...'}
            titleVariant={error ? 'danger' : undefined}
            buttons={[
                { key: 'next', content: 'Next', variant: 'primary', disabled: isLoading || !!error },
            ]}
        >
            {error ? <ProgressBar variant="danger" now={100} /> : <ProgressBar striped animated variant="success" now={progress} />}

            <hr />

            {
                error
                    ? (
                            <p>
                                <Highlight className="json">{JSON.stringify(error, null, 2)}</Highlight>
                            </p>
                        )
                    : isLoading ? <LoadingBanner /> : <></>
            }
        </FullscreenPage>
    );
}
