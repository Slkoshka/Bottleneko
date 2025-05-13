import { Spinner } from 'react-bootstrap';

export default function LoadingBanner({ size }: { size?: 'xl' | 'lg' | 'sm' }) {
    let style = {};
    switch (size) {
        case 'xl':
            style = { width: '5rem', height: '5rem' };
            break;

        case 'lg':
            style = { width: '3rem', height: '3rem' };
            break;

        case 'sm':
            style = { width: '1rem', height: '1rem' };
            break;
    }

    return (
        <div className="d-flex w-100 h-100 justify-content-center align-items-center">
            <Spinner animation="border" style={style} />
        </div>
    );
}
