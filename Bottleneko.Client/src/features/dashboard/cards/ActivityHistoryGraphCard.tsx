import { Line } from 'react-chartjs-2';
import { CategoryScale, Chart, Colors, LinearScale, LineElement, PointElement, Tooltip } from 'chart.js';
import { ReactNode, useState } from 'react';
import { ButtonGroup, Dropdown, DropdownButton } from 'react-bootstrap';
import IconButton from '../../../components/IconButton';
import LoadingBanner from '../../../components/LoadingBanner';
import { useFetchData } from '../../../app/hooks';
import api from '../../api';
import { ActivityStatsItemDto } from '../../api/dtos.gen';
import DashboardCard from './DashboardCard';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Colors, Tooltip);

export default function ActivityHistoryGraphCard() {
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            colors: {
                enabled: true,
            },
            tooltip: {
                enabled: true,
            },
        },
    };

    const getPeriod = (period: 'last-year' | 'last-month' | 'last-day' | 'last-hour', data: 'total-messages' | 'messages-per-minute') => {
        const dataCallback = (stats: ActivityStatsItemDto[]) => {
            switch (data) {
                case 'total-messages':
                    return { id: data, data: stats.map(item => item.totalMessages), label: '# of Messages' };

                case 'messages-per-minute':
                    return { id: data, data: stats.map(item => item.messagesPerMinute), label: 'Messages per Minute' };
            }
        };

        switch (period) {
            case 'last-year':
                return { id: period, fetch: api.system.statsLastYear, name: 'Last Year', data: dataCallback };

            case 'last-month':
                return { id: period, fetch: api.system.statsLastMonth, name: 'Last Month', data: dataCallback };

            case 'last-day':
                return { id: period, fetch: api.system.statsLastDay, name: 'Last Day', data: dataCallback };

            case 'last-hour':
                return { id: period, fetch: api.system.statsLastHour, name: 'Last Hour', data: dataCallback };
        }
    };

    const [period, setPeriod] = useState(getPeriod('last-day', 'total-messages'));

    const [stats, , refresh] = useFetchData(period.fetch, true, 60000);
    let content: ReactNode = <LoadingBanner />;

    if (stats) {
        const data = {
            labels: stats.items.map(item => item.period),
            datasets: [period.data(stats.items)],
        };

        content = (
            <Line options={options} data={data} height={230} />
        );
    }

    return (
        <DashboardCard
            title={(
                <div style={{ display: 'grid', gap: '0.6em', gridTemplateColumns: '1fr 0fr' }}>
                    Activity History

                    <ButtonGroup>
                        <DropdownButton as={ButtonGroup} title={period.name} size="sm">
                            <Dropdown.Item onClick={() => { setPeriod(getPeriod('last-year', period.data([]).id)); }}>Last Year</Dropdown.Item>
                            <Dropdown.Item onClick={() => { setPeriod(getPeriod('last-month', period.data([]).id)); }}>Last Month</Dropdown.Item>
                            <Dropdown.Item onClick={() => { setPeriod(getPeriod('last-day', period.data([]).id)); }}>Last Day</Dropdown.Item>
                            <Dropdown.Item onClick={() => { setPeriod(getPeriod('last-hour', period.data([]).id)); }}>Last Hour</Dropdown.Item>
                        </DropdownButton>

                        <DropdownButton as={ButtonGroup} title={period.data([]).label} size="sm">
                            <Dropdown.Item onClick={() => { setPeriod(getPeriod(period.id, 'total-messages')); }}># of Messages</Dropdown.Item>
                            <Dropdown.Item onClick={() => { setPeriod(getPeriod(period.id, 'messages-per-minute')); }}>Messages per Minute</Dropdown.Item>
                        </DropdownButton>

                        <IconButton icon="arrow-clockwise" tooltip="Refresh" onClick={refresh} />
                    </ButtonGroup>
                </div>
            )}
            className="w-100"
            style={{ height: '300px' }}
        >
            {content}
        </DashboardCard>
    );
}
