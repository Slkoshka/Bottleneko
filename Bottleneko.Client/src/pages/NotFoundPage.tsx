import cryingCatFace from '@netbek/noto-emoji/build/svg/u1f63f.svg';
import { useNavigate } from 'react-router-dom';
import FullscreenPage from '../components/fullscreen-page/FullscreenPage';

export default function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <FullscreenPage>
            <FullscreenPage.Title variant="danger">
                Error
            </FullscreenPage.Title>

            <p style={{ textAlign: 'center' }}><img src={cryingCatFace} style={{ width: '6em', height: '6em' }} /></p>
            <p className="text-center fs-2">
                Page not found
            </p>

            <FullscreenPage.Button action={() => { navigate('/'); }}>
                Return
            </FullscreenPage.Button>
        </FullscreenPage>
    );
}
