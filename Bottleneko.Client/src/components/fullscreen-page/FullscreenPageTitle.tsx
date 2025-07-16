import { Variant } from 'react-bootstrap/esm/types';
import { Card } from 'react-bootstrap';
import { ReactNode } from 'react';

export default function FullscreenPageTitle({ children, variant }: { children: ReactNode; variant?: Variant }) {
    return (
        <Card.Header as="h3" className={`p-3 text-bg-${variant ?? 'primary'}`}>
            {children}
        </Card.Header>
    );
}
