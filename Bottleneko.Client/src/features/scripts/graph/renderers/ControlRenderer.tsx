import { CSSProperties, useEffect, useRef, useState } from 'react';
import { Form } from 'react-bootstrap';
import { ClassicPreset } from 'rete';
import { Drag } from 'rete-react-plugin';

export function ControlRenderer<N extends 'text' | 'number'>({ data, styles }: { data: ClassicPreset.InputControl<N>; styles?: () => CSSProperties }) {
    const [value, setValue] = useState(data.value);
    const ref = useRef(null);

    Drag.useNoDrag(ref);

    useEffect(() => {
        setValue(data.value);
    }, [data.value]);

    return (
        <Form.Control
            value={value}
            type={data.type}
            ref={ref}
            readOnly={data.readonly}
            onChange={(e) => {
                const val = (data.type === 'number' ? +e.target.value : e.target.value) as typeof data['value'];
                setValue(val);
                data.setValue(val);
            }}
            onDoubleClick={(e) => { e.stopPropagation(); }}
            style={styles?.()}
        />
    );
}
