import './info-card.css';
import { ReactElement, ReactNode } from 'react';
import { Card } from 'react-bootstrap';
import InfoCardHeaderExtra, { InfoCardHeaderExtraProps } from './InfoCardHeaderExtra';

export default function InfoCard({ title, children, className = '', props }: { title: string; children: ReactNode; className?: string; props?: object }) {
    let childList: ReactNode[] = children === undefined ? [] : typeof children === 'object' && typeof (children as Iterable<ReactNode>)[Symbol.iterator] === 'function' ? [...(children as Iterable<ReactNode>)] : [children];
    const headerExtra = childList.filter(child => typeof child === 'object' && (child as { type: object }).type === InfoCardHeaderExtra) as ReactElement<InfoCardHeaderExtraProps>[];
    childList = childList.filter(child => !(headerExtra as unknown[]).includes(child));

    return (
        <Card className={`info-card ${className}`} {...props}>
            <Card.Header style={{ display: 'grid', gap: '0.6em', gridTemplateColumns: '0fr 1fr 0fr' }}>
                <div>{headerExtra.filter(item => item.props.position === 'start')}</div>
                <div className="flex-grow-1 text-truncate">
                    <span className="fs-5">
                        <strong>{title}</strong>
                    </span>
                </div>
                <div>{headerExtra.filter(item => item.props.position === 'end')}</div>
            </Card.Header>

            <Card.Body>
                {childList}
            </Card.Body>
        </Card>
    );
}

InfoCard.HeaderExtra = InfoCardHeaderExtra;
