import cryingCatFace from '@netbek/noto-emoji/build/svg/u1f63f.svg';
import { useNavigate } from 'react-router-dom';
import FullscreenPage from '../components/FullscreenPage';

export default function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <FullscreenPage
            title="Error"
            titleVariant="danger"
            buttons={[
                { key: 'back', content: 'Return', disabled: false, action: () => { navigate('/'); } },
            ]}
        >
            <p style={{ textAlign: 'center' }}><img src={cryingCatFace} style={{ width: '6em', height: '6em' }} /></p>
            <p className="text-center fs-2">
                Page not found
            </p>
        </FullscreenPage>
    );
}
