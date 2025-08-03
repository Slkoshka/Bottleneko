import { ReactElement } from 'react';
import { Tabs, Tab as BootstrapTab } from 'react-bootstrap';
import { splitChildren } from '../../app/utils';
import Tab, { TabProps } from './Tab';
import ViewBase, { ViewBaseProps } from './ViewBase';

interface TabViewProps extends ViewBaseProps {
    defaultTab?: string;
}

export default function TabView(props: TabViewProps) {
    const [tabs, rest] = splitChildren(props.children, [Tab]);

    return (
        <ViewBase {...props} className={`view ${props.className ?? ''}`}>
            <Tabs defaultActiveKey={props.defaultTab} variant="pills">
                {
                    (tabs as ReactElement<TabProps>[]).map(tab => (
                        <BootstrapTab key={tab.props.id} eventKey={tab.props.id} title={tab.props.title} className="h-100">
                            <div className="h-100" style={{ padding: '0.5em' }}>
                                {tab.props.children}
                            </div>
                        </BootstrapTab>
                    ))
                }
            </Tabs>

            {rest}
        </ViewBase>
    );
}

TabView.Tab = Tab;
