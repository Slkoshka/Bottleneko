import { Card } from 'react-bootstrap';
import { PropsWithChildren } from 'react';

export default function DashboardCard({ title, children, className = '', props }: { title?: React.ReactNode; className?: string; props?: object } & PropsWithChildren) {
    return (
        <Card className={`dashboard-card ${className}`} style={{ width: '450px', minWidth: '300px' }} {...props}>
            <Card.Header as="h4">{title}</Card.Header>
            <Card.Body>
                <Card.Text as="div">
                    {children}
                </Card.Text>
            </Card.Body>
        </Card>
    );
}
