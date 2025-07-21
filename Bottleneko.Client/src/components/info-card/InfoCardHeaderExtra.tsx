import { ReactNode } from 'react';

export interface InfoCardHeaderExtraProps {
    position: 'start' | 'end';
    children: ReactNode;
}

export default function InfoCardHeaderExtra({ children }: InfoCardHeaderExtraProps) {
    return children;
}
