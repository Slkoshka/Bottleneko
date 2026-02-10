export interface Props {
    type: { factory?: () => { destroy: () => void } };
}
