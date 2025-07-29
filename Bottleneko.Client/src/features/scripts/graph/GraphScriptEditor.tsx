import { useCallback, useEffect, useRef } from 'react';
import { useRete } from 'rete-react-plugin';
import { Button, Card } from 'react-bootstrap';
import { ScriptCode } from '../../api/dtos.gen';
import { createEditor, Editor } from './editor';

export default function GraphScriptEditor({ onChange, props, className }: { initialCode?: string; onChange: (code: ScriptCode) => void; props?: object; className?: string }) {
    const change = useRef(onChange);
    useEffect(() => {
        change.current = onChange;
    }, [onChange]);

    const create = useCallback((el: HTMLElement) => {
        return createEditor(el, change.current);
    }, []);

    const [ref, editor] = useRete<Editor>(create);

    return (
        <Card className={`graph-editor w-100 h-100 ${className ?? ''}`} {...props}>
            <div ref={ref} className="graph-editor-content w-100 h-100" />

            <div style={{ position: 'absolute', zIndex: '0', margin: '10px' }}>
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
