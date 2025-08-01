import { useCallback, useEffect, useRef } from 'react';
import { useRete } from 'rete-react-plugin';
import { Button, Card } from 'react-bootstrap';
import { GraphScriptCode, ScriptCode } from '../../api/dtos.gen';
import { createEditor, Editor } from './editor';

export default function GraphScriptEditor({ initial, onChange, props, className }: { initial?: GraphScriptCode; onChange: (code: ScriptCode) => void; props?: object; className?: string }) {
    const change = useRef(onChange);
    useEffect(() => {
        change.current = onChange;
    }, [onChange]);

    const initialRef = useRef(initial);

    const create = useCallback((el: HTMLElement) => createEditor({ container: el, initial: initialRef.current, onChange: change.current }), []);

    const [ref, editor] = useRete<Editor>(create);

    return (
        <Card className={`graph-editor w-100 h-100 ${className ?? ''}`} {...props}>
            <div ref={ref} className="graph-editor-content w-100 h-100" tabIndex={0} style={{ outline: 'none' }} />

            <div className="graph-editor-controls" style={{ position: 'absolute', zIndex: '0', margin: '10px' }}>
                <Button
                    onClick={(e) => {
                        const bounds = (e.target as HTMLElement).getBoundingClientRect();
                        editor?.showContextMenu(bounds.right, bounds.y);
                    }}
                >
                    Add
                </Button>
            </div>
        </Card>
    );
}
