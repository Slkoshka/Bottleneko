import './dashboard-card.scss';
import { Card } from 'react-bootstrap';
import { CSSProperties, PropsWithChildren } from 'react';

export default function DashboardCard({ title, children, className = '', style, props }: { title?: React.ReactNode; className?: string; style?: CSSProperties; props?: object } & PropsWithChildren) {
    return (
        <Card className={`dashboard-card ${className}`} style={{ width: '450px', minWidth: '300px', ...style }} {...props}>
            <Card.Header className="dashboard-card-header"><span className="fs-5">{title}</span></Card.Header>
            <Card.Body>
                <Card.Text as="div">
                    {children}
                </Card.Text>
            </Card.Body>
        </Card>
    );
}
