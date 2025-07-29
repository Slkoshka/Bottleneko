import { Alert, Button, Form } from 'react-bootstrap';
import { useCallback, useState } from 'react';
import { Formik } from 'formik';
import * as yup from 'yup';
import { useAsync } from '../../app/hooks';
import { ScriptCode, ScriptDto } from '../api/dtos.gen';
import api from '../api';
import { useScripts } from './context';
import JsScriptEditor from './js/JsScriptEditor';
import GraphScriptEditor from './graph/GraphScriptEditor';

export const EditedScriptSchema = yup.object().shape({
    name: yup.string().default('').required('Name cannot be empty'),
    description: yup.string().default(''),
    code: yup.mixed().oneOfSchemas<ScriptCode>([
        yup.object().shape({
            $type: yup.string().default('JavaScript'),
            source: yup.string(),
        }),
        yup.object().shape({
            $type: yup.string().default('Graph'),
            data: yup.string(),
        }),
    ]),
});

export type EditedScript = yup.InferType<typeof EditedScriptSchema>;

export default function ScriptEditor({ id, script, onSaved }: { id?: string; script: EditedScript; onSaved?: (script: ScriptDto) => void }) {
    const [error, setError] = useState<string | undefined>(undefined);
    const scripts = useScripts();

    const onError = useCallback((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Unknown error');
    }, []);

    const [saveScript, isLoading] = useAsync(useCallback(async (formData: EditedScript) => {
        if (id) {
            const response = await api.scripts.update(id, formData);
            scripts?.actions.updated(response.result);
            onSaved?.(response.result);
        }
        else {
            const response = await api.scripts.add(formData.name, formData.description, formData.code);
            scripts?.actions.added(response.result);
            onSaved?.(response.result);
        }
    }, [id, onSaved, scripts]));

    const onValidated = useCallback((formData: EditedScript) => {
        saveScript(formData).catch(onError);
    }, [saveScript, onError]);

    const createCodeEditor = (code: ScriptCode, setFieldValue: (name: string, value: unknown) => void) => {
        switch (code.$type) {
            case 'JavaScript':
                return (
                    <JsScriptEditor
                        initialCode={code.source}
                        onChange={(code) => {
                            setFieldValue('code', code);
                        }}
                    />
                );

            case 'Graph':
                return (
                    <GraphScriptEditor
                        onChange={(code) => {
                            setFieldValue('code', code);
                        }}
                    />
                );
        }
    };

    return (
        <>
            <Formik validationSchema={EditedScriptSchema} onSubmit={onValidated} initialValues={script} validateOnChange={false}>
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
                        {
                            error
                                ? (
                                        <Alert variant="danger">
                                            <h2 className="fs-4">{id ? 'Failed to save script' : 'Failed to create new script'}</h2>
                                            {error}
                                        </Alert>
                                    )
                                : <></>
                        }

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
                        {createCodeEditor(values.code, (name, value) => void setFieldValue(name, value))}

                        <hr />

                        <div className="d-flex justify-content-center">
                            <Button size="lg" style={{ width: 'min(15%, 400px)', minWidth: '200px' }} type="submit" disabled={isLoading}>
                                {
                                    id
                                        ? (isLoading ? 'Saving...' : 'Save')
                                        : (isLoading ? 'Creating...' : 'Create')
                                }

                            </Button>
                        </div>
                    </Form>
                )}
            </Formik>
        </>
    );
}
