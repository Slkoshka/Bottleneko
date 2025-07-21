import { ReactNode } from 'react';
import * as clipboard from 'clipboard-polyfill';
import IconButton from './IconButton';

export default function CopyableLabel({ text, children }: { text: string; children: ReactNode }) {
    return (
        <div style={{ display: 'grid', gap: '0.5em', gridTemplateColumns: '1fr 0fr', alignItems: 'center' }}>
            {children}
            <IconButton icon="copy" tooltip="Copy to clipboard" style={{ width: '1.75em', height: '1.75em' }} onClick={() => void clipboard.writeText(text)} />
        </div>
    );
}
