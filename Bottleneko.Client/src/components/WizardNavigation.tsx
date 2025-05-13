import { Button } from 'react-bootstrap';

export function WizardNavigation({ back, next }: { back?: (() => void) | undefined; next?: (() => void) | undefined }) {
    return (
        <>
            <hr />
            <div className="d-flex justify-content-center mx-auto">
                <Button size="lg" className="mx-2" style={{ minWidth: '25%' }} disabled={!back} onClick={back} variant="secondary">Back</Button>
                <Button size="lg" className="mx-2" style={{ minWidth: '25%' }} disabled={!next} onClick={next}>Next</Button>
            </div>
        </>
    );
}
