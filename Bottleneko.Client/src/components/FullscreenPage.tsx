import { ReactNode } from 'react';
import { Button, Card } from 'react-bootstrap';
import { Variant } from 'react-bootstrap/esm/types';

interface FullscreenPageButton {
    key: string;
    content: ReactNode;
    variant?: Variant;
    disabled: boolean | undefined;
    size?: 'sm' | 'lg';
    action?: 'submit' | 'reset' | (() => void);
}

export default function FullscreenPage({ children, title, titleVariant, buttons }: { children?: ReactNode[] | ReactNode; title: ReactNode; titleVariant?: Variant; buttons?: FullscreenPageButton[] }) {
    return (
        <div className="d-flex vw-100v vh-100 align-items-center justify-content-center">
            <Card className="dashboard-card shadow" style={{ width: '560px' }}>
                <Card.Header as="h3" className={`p-3 text-bg-${titleVariant ?? 'primary'}`}>{title}</Card.Header>
                <Card.Body>
                    <Card.Text as="div">
                        {children}
                    </Card.Text>
                </Card.Body>
                {
                    buttons && buttons.length > 0
                        ? (
                                <Card.Footer>
                                    <div className="float-end">
                                        {
                                            buttons.map(button => (
                                                <Button
                                                    key={button.key}
                                                    size={button.size ?? 'lg'}
                                                    className="mx-2 px-4"
                                                    variant={button.variant}
                                                    disabled={button.disabled}
                                                    type={
                                                        typeof button.action === 'string' ? button.action : undefined
                                                    }
                                                    onClick={typeof button.action === 'function' ? button.action : undefined}
                                                >
                                                    {button.content}
                                                </Button>
                                            ))
                                        }
                                    </div>
                                </Card.Footer>
                            )
                        : null
                }
            </Card>
        </div>
    );
}
