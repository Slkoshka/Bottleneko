import { CSSProperties, useRef, useState } from 'react';
import { Form } from 'react-bootstrap';
import { Drag } from 'rete-react-plugin';
import { OptionListInputControl } from '../controls/OptionListInputControl';
import { NumberInputControl } from '../controls/NumberInputControl';
import { TextInputControl } from '../controls/TextInputControl';
import { ToggleInputControl } from '../controls/ToggleInputControl';
import { NekoControl } from '../controls/NekoControl';

export function ControlRenderer({ data, styles }: { data: NekoControl; styles?: () => CSSProperties }) {
    const [value, setValue] = useState<unknown>(data.value);
    const ref = useRef(null);

    Drag.useNoDrag(ref);

    if (value !== data.value) {
        setValue(data.value);
    }

    if (data instanceof TextInputControl || data instanceof NumberInputControl) {
        return (
            <>
                <div className="graph-node-control-label">
                    {
                        data.label
                    }
                </div>
                <Form.Control
                    value={value as number | string}
                    type={data instanceof TextInputControl ? 'text' : 'number'}
                    ref={ref}
                    min={data instanceof NumberInputControl ? data.min : undefined}
                    max={data instanceof NumberInputControl ? data.max : undefined}
                    onChange={(e) => {
                        const val = data instanceof TextInputControl ? e.target.value : +e.target.value;
                        setValue(val);
                        if (data.fastUpdate) {
                            (data.setValue as ((value?: string | number) => void))(val);
                        }
                    }}
                    onBlur={() => {
                        if (!data.fastUpdate) {
                            (data.setValue as ((value?: string | number) => void))(value as number | string);
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.code === 'Enter') {
                            e.preventDefault();
                            (data.setValue as ((value?: string | number) => void))(value as number | string);
                            (e.target as HTMLElement).blur();
                        }

                        e.stopPropagation();
                    }}
                    onDoubleClick={(e) => { e.stopPropagation(); }}
                    style={styles?.()}
                />
            </>
        );
    }
    else if (data instanceof ToggleInputControl) {
        return (
            <Form.Switch
                ref={ref}
                label={data.label}
                checked={data.value}
                onChange={(e) => {
                    const value = e.target.checked;
                    setValue(value);
                    data.setValue(value);
                }}
                onDoubleClick={(e) => { e.stopPropagation(); }}
                style={styles?.()}
            />
        );
    }
    else if (data instanceof OptionListInputControl) {
        const options = data.options();
        const selectedOption = options.findIndex(option => option.value === value);

        return (
            <>
                <div className="graph-node-control-label">
                    {
                        data.label
                    }
                </div>
                <Form.Select
                    ref={ref}
                    value={selectedOption}
                    onChange={(e) => {
                        const value = options[Number.parseInt(e.target.value)].value as unknown;
                        setValue(value);
                        data.setValue(value);
                    }}
                    onDoubleClick={(e) => { e.stopPropagation(); }}
                    style={styles?.()}
                    size="sm"
                >
                    {
                        options.map((option, idx) => (
                            <option key={idx} value={idx}>{option.name}</option>
                        ))
                    }
                </Form.Select>
            </>
        );
    }
    else {
        return <></>;
    }
}
