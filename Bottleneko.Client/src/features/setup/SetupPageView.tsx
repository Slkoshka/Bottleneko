import { useState } from 'react';
import SetupPageWelcome from './SetupPageWelcome';
import SetupPageFinish from './SetupPageFinish';
import SetupPageAccount from './SetupPageAccount';
import SetupPageInitialization from './SetupPageInitialization';

export type SetupStage = { stage: 'welcome' } | { stage: 'account' } | { stage: 'initialization'; account: { login: string; password: string } } | { stage: 'finish' };

export default function SetupPageView() {
    const [stage, setStage] = useState<SetupStage>({ stage: 'welcome' });

    switch (stage.stage) {
        case 'welcome':
            return <SetupPageWelcome progress={25} setStage={setStage} />;

        case 'account':
            return <SetupPageAccount progress={50} setStage={setStage} />;

        case 'initialization':
            return <SetupPageInitialization progress={75} account={stage.account} setStage={setStage} />;

        case 'finish':
            return <SetupPageFinish progress={100} />;

        default:
            return <></>;
    }
}
