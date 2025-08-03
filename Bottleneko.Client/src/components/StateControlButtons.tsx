import { ButtonGroup, Dropdown } from 'react-bootstrap';
import IconButton from './IconButton';
import { HamburgerMenu } from './HamburgerMenu';
import InlineIcon from './InlineIcon';

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

    onDelete: () => void;
    canDelete: boolean;

    size?: string;
}

export default function StateControlButtons({ onStart, onRestart, onStop, canStart, canRestart, canStop, startTooltip, restartTooltip, stopTooltip, onDelete, canDelete, size = '3rem' }: StateControlButtonsProps) {
    return (
        <div className="d-flex justify-content-end gap-2">
            <ButtonGroup>
                <IconButton icon="play-fill" tooltip={startTooltip ?? 'Start'} style={{ width: size, height: size }} variant="primary" disabled={!canStart} onClick={onStart} />
                <IconButton icon="arrow-clockwise" tooltip={restartTooltip ?? 'Restart'} style={{ width: size, height: size }} variant="primary" disabled={!canRestart} onClick={onRestart} />
                <IconButton icon="stop-circle" tooltip={stopTooltip ?? 'Stop'} style={{ width: size, height: size }} variant="primary" disabled={!canStop} onClick={onStop} />
            </ButtonGroup>
            <Dropdown>
                <Dropdown.Toggle as={HamburgerMenu} style={{ width: size, height: size, display: 'block' }} />
                <Dropdown.Menu>
                    <Dropdown.Item as="button" onClick={() => { onStart(); }} disabled={!canStart}>
                        <InlineIcon icon="play-fill" style={{ marginRight: '0.5em' }} />
                        {startTooltip ?? 'Start'}
                    </Dropdown.Item>
                    <Dropdown.Item as="button" onClick={() => { onRestart(); }} disabled={!canRestart}>
                        <InlineIcon icon="arrow-clockwise" style={{ marginRight: '0.5em' }} />
                        {restartTooltip ?? 'Restart'}
                    </Dropdown.Item>
                    <Dropdown.Item as="button" onClick={() => { onStop(); }} disabled={!canStop}>
                        <InlineIcon icon="stop-circle" style={{ marginRight: '0.5em' }} />
                        {stopTooltip ?? 'Stop'}
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item as="button" onClick={() => { onDelete(); }} disabled={!canDelete}>
                        <InlineIcon icon="trash3-fill" style={{ marginRight: '0.5em' }} />
                        Delete
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
        </div>
    );
}
