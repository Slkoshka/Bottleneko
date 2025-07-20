import IconButton from './IconButton';

interface StateControlButtonsProps {
    onStart: () => void;
    canStart: boolean;
    startTooltip?: string;

    onRestart: () => void;
    canRestart: boolean;
    restartTooltip?: string;

    onStop: () => void;
    canStop: boolean;
    stopTooltip?: string;
}

export default function StateControlButtons({ onStart, onRestart, onStop, canStart, canRestart, canStop, startTooltip, restartTooltip, stopTooltip }: StateControlButtonsProps) {
    return (
        <>
            <IconButton icon="play-fill" tooltip={startTooltip ?? 'Start'} style={{ width: '2.75rem', height: '2.75rem' }} variant="success" disabled={!canStart} onClick={onStart} />
            <IconButton icon="arrow-clockwise" tooltip={restartTooltip ?? 'Restart'} style={{ width: '2.75rem', height: '2.75rem' }} variant="warning" disabled={!canRestart} onClick={onRestart} />
            <IconButton icon="stop-circle" tooltip={stopTooltip ?? 'Stop'} style={{ width: '2.75rem', height: '2.75rem' }} variant="danger" disabled={!canStop} onClick={onStop} />
        </>
    );
}
