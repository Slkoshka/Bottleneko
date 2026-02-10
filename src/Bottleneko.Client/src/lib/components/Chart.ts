import {
    CategoryScale,
    Chart,
    Colors,
    LinearScale,
    LineController,
    LineElement,
    PointElement,
    Tooltip,
} from 'chart.js';

Chart.register(CategoryScale, LinearScale, PointElement, LineController, LineElement, Colors, Tooltip);

export interface Props {
    labels: string[];
    values: { id: string; label: string; data: number[] }[];
}
