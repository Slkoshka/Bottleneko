import './info-card.css';
import { ReactElement, ReactNode } from 'react';
import { Card } from 'react-bootstrap';
import { splitChildren } from '../../app/utils';
import HeaderExtra, { HeaderExtraProps } from '../HeaderExtra';

export default function InfoCard({ title, highlightHeader, children, className = '', props }: { title: string; highlightHeader?: boolean; children: ReactNode; className?: string; props?: object }) {
    const [headerExtra, rest] = splitChildren(children, [HeaderExtra]);

    return (
        <Card className={`info-card ${className}`} {...props}>
            <Card.Header className={`info-card-header ${highlightHeader ? 'highlight' : ''}`} style={{ display: 'grid', gap: '0.6em', gridTemplateColumns: '0fr 1fr 0fr' }}>
                <div>{(headerExtra as ReactElement<HeaderExtraProps>[]).filter(item => item.props.position === 'start')}</div>
                <div className="flex-grow-1 text-truncate">
                    <span className="fs-5">
                        {title}
                    </span>
                </div>
                <div>{(headerExtra as ReactElement<HeaderExtraProps>[]).filter(item => item.props.position === 'end')}</div>
            </Card.Header>

            <Card.Body>
                {rest}
            </Card.Body>
        </Card>
    );
}

InfoCard.HeaderExtra = HeaderExtra;
