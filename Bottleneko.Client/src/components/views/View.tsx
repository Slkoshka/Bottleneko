import { ReactNode } from 'react';
import LoadingBanner from '../LoadingBanner';

interface ViewProps {
    title: React.ReactNode;
    loading?: boolean;
    style?: React.CSSProperties;
    className?: string;
    children?: ReactNode;
    props?: object;
}

export default function View({ title, loading = false, style, className, children, props }: ViewProps) {
    return (
        <div className={`d-flex flex-column h-100 ${className ?? ''}`} {...props} style={style ?? {}}>
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
