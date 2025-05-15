import { Tab, Tabs } from 'react-bootstrap';
import LogViewer from '../log/LogViewer';
import View from '../../components/View';
import ProxySettings from '../proxies/ProxySettings';

export default function SettingsView() {
    return (
        <View title="Settings">
            <Tabs defaultActiveKey="network">
                <Tab eventKey="network" title="Network" className="h-100 m-3">
                    <ProxySettings />
                </Tab>
                <Tab eventKey="logs" title="Logs" className="h-100">
                    <LogViewer />
                </Tab>
            </Tabs>
        </View>
    );
}
