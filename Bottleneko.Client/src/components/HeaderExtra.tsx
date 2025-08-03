import { ReactNode } from 'react';

export interface HeaderExtraProps {
    position: 'start' | 'end';
    children: ReactNode;
}

export default function HeaderExtra({ children }: HeaderExtraProps) {
    return children;
}
