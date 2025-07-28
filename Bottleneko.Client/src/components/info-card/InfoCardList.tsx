import './info-card.css';
import { ReactNode } from 'react';

export default function InfoCardList({ children }: { children: ReactNode }) {
    return (
        <div className="info-card-list">
            {children}
        </div>
    );
};
