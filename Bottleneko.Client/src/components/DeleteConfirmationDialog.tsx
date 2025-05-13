import { ReactNode } from 'react';
import { Table } from 'react-bootstrap';
import ConfirmationDialog from './ConfirmationDialog';

export interface ItemInfoProperty { name: string; value: ReactNode[] | ReactNode | undefined }
export interface DeleteConfirmationDialogProps<T = unknown> { item?: T; itemInfoBuilder?: (item: T) => Record<string, ItemInfoProperty>; itemTypeName: string; onCancel?: () => void; onDelete?: (item: T) => void }

export default function DeleteConfirmationDialog<T>({ item, itemInfoBuilder, itemTypeName, onCancel, onDelete }: DeleteConfirmationDialogProps<T>) {
    const onAccept = () => {
        if (item) {
            onDelete?.(item);
        }
    };

    const renderItemInfo = (info: Record<string, ItemInfoProperty>) => {
        return Object.keys(info).map((key) => {
            return (
                <tr key={key}>
                    <td>{info[key].name}</td>
                    <td className="font-monospace">{info[key].value}</td>
                </tr>
            );
        });
    };

    return (
        <ConfirmationDialog show={!!item} acceptText="Delete" onCancel={onCancel} onAccept={onAccept} acceptVariant="danger">
            <p>
                Are you sure you want to delete the following
                {' '}
                {itemTypeName}
                ?
            </p>
            {
                item && itemInfoBuilder
                    ? (
                            <Table striped responsive>
                                <tbody>
                                    {renderItemInfo(itemInfoBuilder(item))}
                                </tbody>
                            </Table>
                        )
                    : <></>
            }
        </ConfirmationDialog>
    );
}
