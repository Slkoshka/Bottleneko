import { CSSProperties } from 'react';
import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import Icon from './Icon';

export default function IconButton({ icon, tooltip, style, ...args }: { icon: string; tooltip: React.ReactNode | null; style?: CSSProperties } & Parameters<typeof Button>[0]) {
    const renderTooltip = (props: object) => <Tooltip {...props}>{tooltip}</Tooltip>;
    const button = (
        <Button style={{ aspectRatio: '1', height: '2em', padding: '0.25em', ...style }} {...args}>
            <Icon icon={icon} />
        </Button>
    );

    return (
        tooltip
            ? (
                    <OverlayTrigger placement="bottom" overlay={renderTooltip}>
                        {button}
                    </OverlayTrigger>
                )
            : button
    );
}
