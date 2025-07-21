import LogViewer from '../log/LogViewer';
import TabView from '../../components/views/TabView';
import ProxySettings from '../proxies/ProxySettings';

export default function SettingsView() {
    return (
        <TabView title="Settings" defaultTab="network" fillScreen>
            <TabView.Tab id="network" title="Network">
                <ProxySettings />
            </TabView.Tab>

            <TabView.Tab id="logs" title="Logs" margin={false}>
                <LogViewer />
            </TabView.Tab>
        </TabView>
    );
}
