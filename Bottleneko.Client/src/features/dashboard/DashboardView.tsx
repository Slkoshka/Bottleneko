import View from '../../components/View';
import api from '../api';
import { useFetchData } from '../../app/hooks';
import SystemDashboardCard from './cards/SystemDashboardCard';
import BotDashboardCard from './cards/BotDashboardCard';
import ConnectionsDashboardCard from './cards/ConnectionsDashboardCard';
import MessagesDashboardCard from './cards/MessagesDashboardCard';

const fetchInfo = (signal: AbortSignal) => api.system.getInfo(signal);

export default function DashboardView() {
    const [systemInfo] = useFetchData(fetchInfo, true, 3000);

    return (
        <View title="Dashboard">
            <div className="d-flex flex-wrap justify-content-start align-items-stretch" style={{ gap: '30px' }}>
                <BotDashboardCard systemInfo={systemInfo ?? undefined} />
                <SystemDashboardCard systemInfo={systemInfo ?? undefined} />
                <ConnectionsDashboardCard />
                <MessagesDashboardCard systemInfo={systemInfo ?? undefined} />
            </div>
        </View>
    );
}
