import { useState } from 'react';
import SetupPageWelcome from './SetupPageWelcome';
import SetupPageFinish from './SetupPageFinish';
import SetupPageAccount from './SetupPageAccount';
import SetupPageInitialization from './SetupPageInitialization';

export type SetupStage = { stage: 'welcome' } | { stage: 'account' } | { stage: 'initialization'; account: { login: string; password: string } } | { stage: 'finish' };

export default function SetupPageView() {
    const [stage, setStage] = useState<SetupStage>({ stage: 'welcome' });

    let stageView = <div />;
    switch (stage.stage) {
        case 'welcome':
            stageView = <SetupPageWelcome progress={25} setStage={setStage} />;
            break;

        case 'account':
            stageView = <SetupPageAccount progress={50} setStage={setStage} />;
            break;

        case 'initialization':
            stageView = <SetupPageInitialization progress={75} account={stage.account} setStage={setStage} />;
            break;

        case 'finish':
            stageView = <SetupPageFinish progress={100} />;
            break;
    }

    return stageView;
}
