import { FC, ReactNode } from 'react';

export interface TabProps {
    id: string;
    title: ReactNode;
    children: ReactNode;
};

const Tab = (function () {
    throw new Error('Cannot render Tab component');
}) as unknown as FC<TabProps>;

export default Tab;
