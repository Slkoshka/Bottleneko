import { CSSProperties, useEffect, useRef, useState } from 'react';
import { Form } from 'react-bootstrap';
import { Drag } from 'rete-react-plugin';
import { OptionListInputControl } from '../controls/OptionListInputControl';
import { NumberInputControl } from '../controls/NumberInputControl';
import { TextInputControl } from '../controls/TextInputControl';

type Control =
    TextInputControl |
    NumberInputControl |
    OptionListInputControl<never>;

export function ControlRenderer({ data, styles }: { data: Control; styles?: () => CSSProperties }) {
    const [value, setValue] = useState(data.value);
    const ref = useRef(null);

    Drag.useNoDrag(ref);

    useEffect(() => {
        setValue(data.value);
    }, [data.value]);

    const renderControl = () => {
        if (data instanceof TextInputControl || data instanceof NumberInputControl) {
            return (
                <Form.Control
                    value={value}
                    type={data instanceof TextInputControl ? 'text' : 'number'}
                    ref={ref}
                    onChange={(e) => {
                        const val = data instanceof TextInputControl ? e.target.value : +e.target.value;
                        setValue(val);
                    }}
                    onBlur={() => {
                        (data.setValue as ((value?: string | number) => void))(value);
                    }}
                    onKeyDown={(e) => {
                        if (e.code === 'Enter') {
                            e.preventDefault();
                            (data.setValue as ((value?: string | number) => void))(value);
                            (e.target as HTMLElement).blur();
                        }

                        e.stopPropagation();
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
                <Form.Select
                    ref={ref}
                    value={selectedOption}
                    onChange={(e) => {
                        const value = options[Number.parseInt(e.target.value)].value;
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
            );
        }
        else {
            return <></>;
        }
    };

    return (
        <>
            <div className="graph-node-control-label">
                {
                    data.label
                }
            </div>
            {renderControl()}
        </>
    );
}
