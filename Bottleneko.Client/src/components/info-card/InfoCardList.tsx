import './info-card.css';
import { ReactNode } from 'react';

export default function InfoCardList({ className, children }: { className?: string; children: ReactNode }) {
    return (
        <div className={`info-card-list ${className ?? ''}`}>
            {children}
        </div>
    );
};
