import { ReactNode } from 'react';
import { Accordion } from 'react-bootstrap';
import LogViewer from '../log/LogViewer';
import TabView from '../../components/views/TabView';
import ProxySettings from '../proxies/ProxySettings';

export default function SettingsView() {
    const renderSettings = (items: Record<string, { title: string; render: () => ReactNode }>) => {
        return (
            <Accordion alwaysOpen defaultActiveKey={Object.keys(items)}>
                {
                    Object.entries(items).map(([key, item]) => (
                        <Accordion.Item key={key} eventKey={key}>
                            <Accordion.Header><span className="fs-5">{item.title}</span></Accordion.Header>
                            <Accordion.Body>
                                {item.render()}
                            </Accordion.Body>
                        </Accordion.Item>
                    ))
                }
            </Accordion>
        );
    };

    return (
        <TabView title="Settings" defaultTab="general" fillScreen>
            <TabView.Tab id="general" title="General">
                {
                    renderSettings({
                        network: {
                            title: 'Network',
                            render: () => <ProxySettings />,
                        },
                    })
                }
            </TabView.Tab>

            <TabView.Tab id="logs" title="Logs">
                <LogViewer />
            </TabView.Tab>
        </TabView>
    );
}
