import './view.scss';
import { ReactNode } from 'react';
import LoadingBanner from '../LoadingBanner';

export interface ViewBaseProps {
    title: React.ReactNode;
    loading?: boolean;
    fillScreen?: boolean;
    style?: React.CSSProperties;
    className?: string;
    children?: ReactNode;
    props?: object;
}

export default function ViewBase({ title, loading = false, fillScreen = false, style, className, children, props }: ViewBaseProps) {
    return (
        <div className={`d-flex flex-column h-100 ${fillScreen ? 'fill-screen' : ''} ${className ?? ''}`} {...props} style={style ?? {}}>
            {
                title
                    ? (
                            <>
                                <h1>{title}</h1>
                                <hr />
                            </>
                        )
                    : <></>
            }
            {loading ? <LoadingBanner /> : children}
        </div>
    );
}
