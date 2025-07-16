import { ReactElement, ReactNode } from 'react';
import { Tabs, Tab as BootstrapTab } from 'react-bootstrap';
import View from './View';
import Tab, { TabProps } from './Tab';

interface TabViewProps {
    title: React.ReactNode;
    loading?: boolean;
    defaultTab?: string;
    style?: React.CSSProperties;
    className?: string;
    children?: ReactNode;
    props?: object;
}

export default function TabView({ title, loading = false, defaultTab, children, props, style, className }: TabViewProps) {
    let childList: ReactNode[] = children === undefined ? [] : typeof children === 'object' && typeof (children as Iterable<ReactNode>)[Symbol.iterator] === 'function' ? [...(children as Iterable<ReactNode>)] : [children];
    const tabs = childList.filter(child => typeof child === 'object' && (child as { type: object }).type === Tab) as ReactElement<TabProps>[];
    childList = childList.filter(child => !(tabs as unknown[]).includes(child));

    return (
        <View title={title} loading={loading} props={props} style={style} className={className}>
            <Tabs defaultActiveKey={defaultTab}>
                {
                    tabs.map(tab => (
                        <BootstrapTab key={tab.props.id} eventKey={tab.props.id} title={tab.props.title} className={`h-100 ${!('margin' in tab.props) || tab.props.margin ? 'm-3' : ''}`}>
                            {tab.props.children}
                        </BootstrapTab>
                    ))
                }
            </Tabs>

            {childList}
        </View>
    );
}

TabView.Tab = Tab;
