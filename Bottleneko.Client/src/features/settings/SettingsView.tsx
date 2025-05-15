import { Tab, Tabs } from 'react-bootstrap';
import LogViewer from '../log/LogViewer';
import View from '../../components/View';

export default function SettingsView() {
    return (
        <View title="Settings">
            <Tabs defaultActiveKey="logs">
                <Tab eventKey="logs" title="Logs" className="h-100">
                    <LogViewer />
                </Tab>
            </Tabs>
        </View>
    );
}
