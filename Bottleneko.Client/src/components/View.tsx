import { PropsWithChildren } from 'react';
import LoadingBanner from './LoadingBanner';

export default function View({ title, loading = false, children, props, style, className }: { title: React.ReactNode; loading?: boolean; props?: object; style?: React.CSSProperties; className?: string } & PropsWithChildren) {
    const titleElement = (
        title
            ? (
                    <>
                        <h1>{title}</h1>
                        <hr />
                    </>
                )
            : null
    );
    const content = loading ? <LoadingBanner /> : children;

    return (
        <div className={`d-flex flex-column h-100 ${className ?? ''}`} {...props} style={style ?? {}}>
            {titleElement}
            {content}
        </div>
    );
}
