import { CSSProperties, forwardRef, Ref } from 'react';
import { Button, ButtonProps, OverlayTrigger, Tooltip } from 'react-bootstrap';
import Icon from './Icon';

type Props = { icon: string; tooltip: React.ReactNode | null; style?: CSSProperties } & ButtonProps;

const IconButton = forwardRef<HTMLButtonElement, Props>(function IconButton({ icon, tooltip, style, ...props }: Props, ref: Ref<HTMLButtonElement>) {
    const renderTooltip = (props: object) => <Tooltip {...props}>{tooltip}</Tooltip>;
    const button = (
        <Button style={{ aspectRatio: '1', height: '2em', padding: '0', ...style }} ref={ref} {...props}>
            <Icon icon={icon} style={{ width: '70%', height: '70%', margin: '15%' }} />
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
});

export default IconButton;
