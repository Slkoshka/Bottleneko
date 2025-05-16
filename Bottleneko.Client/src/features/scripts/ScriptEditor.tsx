import { Alert, Button, Form } from 'react-bootstrap';
import { useCallback, useState } from 'react';
import { Formik } from 'formik';
import * as yup from 'yup';
import { useAsync } from '../../app/hooks';
import { JsScriptCode, ScriptDto } from '../api/dtos.gen';
import api from '../api';
import JsScriptEditor from './JsScriptEditor';

// eslint-disable-next-line import/default
import defaultCode from './defaultScript?raw';

export const EditedScriptSchema = yup.object().shape({
    name: yup.string().default('').required('Name cannot be empty'),
    description: yup.string().default(''),
    code: yup.object().shape({
        $type: yup.string().default('JavaScript'),
        source: yup.string().default(defaultCode),
    }),
});

export type EditedScript = yup.InferType<typeof EditedScriptSchema>;

export default function ScriptEditor({ initialScript, onSaved }: { initialScript?: ScriptDto; onSaved?: (script: ScriptDto) => void }) {
    const [error, setError] = useState<string | undefined>(undefined);

    const onError = useCallback((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Unknown error');
    }, []);

    const [saveScript, isLoading] = useAsync(useCallback(async (formData: EditedScript) => {
        if (initialScript) {
            await api.scripts.update(initialScript.id, formData);
            onSaved?.({
                id: initialScript.id,
                autoStart: initialScript.autoStart,
                status: initialScript.status,
                ...formData,
            });
        }
        else {
            const response = await api.scripts.add(formData.name, formData.description, formData.code);
            onSaved?.(response.script);
        }
    }, [initialScript, onSaved]));

    const onValidated = useCallback((formData: EditedScript) => {
        saveScript(formData).catch(onError);
    }, [saveScript, onError]);

    return (
        <>
            {
                error
                    ? (
                            <Alert variant="danger">
                                <h2 className="fs-4">{initialScript ? 'Failed to save script' : 'Failed to create new script'}</h2>
                                {error}
                            </Alert>
                        )
                    : <></>
            }

            <Formik validationSchema={EditedScriptSchema} onSubmit={onValidated} initialValues={(initialScript as (ScriptDto & { code: JsScriptCode }) | undefined) ?? EditedScriptSchema.getDefault()} validateOnChange={false}>
                {({ handleSubmit, handleChange, setFieldValue, values, errors }) => (
                    <Form
                        className="d-flex flex-column flex-grow-1 h-100"
                        style={{ gap: '10px' }}
                        noValidate
                        onSubmit={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSubmit();
                        }}
                    >
                        <Form.Group>
                            <Form.Label>Name</Form.Label>
                            <Form.Control name="name" value={values.name} onChange={handleChange} isInvalid={!!errors.name} disabled={isLoading} />
                            <Form.Control.Feedback type="invalid">
                                {errors.name}
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group>
                            <Form.Label>Description</Form.Label>
                            <Form.Control as="textarea" name="description" rows={2} value={values.description} onChange={handleChange} isInvalid={!!errors.description} disabled={isLoading} />
                            <Form.Control.Feedback type="invalid">
                                {errors.description}
                            </Form.Control.Feedback>
                        </Form.Group>

                        <span>Code</span>
                        <JsScriptEditor initialCode={values.code.source} onChange={(code) => { void setFieldValue('code', code); }} />

                        <hr />

                        <div className="d-flex justify-content-center">
                            <Button size="lg" style={{ width: 'min(15%, 400px)', minWidth: '200px' }} type="submit" disabled={isLoading}>
                                {
                                    initialScript
                                        ? (isLoading ? 'Saving...' : 'Save')
                                        : (isLoading ? 'Adding...' : 'Add')
                                }

                            </Button>
                        </div>
                    </Form>
                )}
            </Formik>
        </>
    );
}
