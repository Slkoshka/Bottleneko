import { ReactElement, ReactNode } from 'react';
import { Tabs, Tab as BootstrapTab } from 'react-bootstrap';
import Tab, { TabProps } from './Tab';
import ViewBase, { ViewBaseProps } from './ViewBase';

interface TabViewProps extends ViewBaseProps {
    defaultTab?: string;
}

export default function TabView(props: TabViewProps) {
    let childList: ReactNode[] = props.children === undefined ? [] : typeof props.children === 'object' && typeof (props.children as Iterable<ReactNode>)[Symbol.iterator] === 'function' ? [...(props.children as Iterable<ReactNode>)] : [props.children];
    const tabs = childList.filter(child => typeof child === 'object' && (child as { type: object }).type === Tab) as ReactElement<TabProps>[];
    childList = childList.filter(child => !(tabs as unknown[]).includes(child));

    return (
        <ViewBase {...props} className={`tab-view ${props.className ?? ''}`}>
            <Tabs defaultActiveKey={props.defaultTab}>
                {
                    tabs.map(tab => (
                        <BootstrapTab key={tab.props.id} eventKey={tab.props.id} title={tab.props.title} className={`h-100 ${!('margin' in tab.props) || tab.props.margin ? 'm-3' : ''}`}>
                            {tab.props.children}
                        </BootstrapTab>
                    ))
                }
            </Tabs>

            {childList}
        </ViewBase>
    );
}

TabView.Tab = Tab;
