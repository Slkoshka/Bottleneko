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
        <ViewBase {...props} className={`tab-view ${props.className ?? ''}`}>
            <Tabs defaultActiveKey={props.defaultTab}>
                {
                    (tabs as ReactElement<TabProps>[]).map(tab => (
                        <BootstrapTab key={tab.props.id} eventKey={tab.props.id} title={tab.props.title} className={`h-100 ${!('margin' in tab.props) || tab.props.margin ? 'm-3' : ''}`}>
                            {tab.props.children}
                        </BootstrapTab>
                    ))
                }
            </Tabs>

            {rest}
        </ViewBase>
    );
}

TabView.Tab = Tab;
