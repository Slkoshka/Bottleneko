// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
    type StyleVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';
    type ButtonStyleVariant =
        | StyleVariant
        | 'outline-primary'
        | 'outline-secondary'
        | 'outline-success'
        | 'outline-danger'
        | 'outline-warning'
        | 'outline-info'
        | 'outline-light'
        | 'outline-dark'
        | 'link';
    type StyleSize = 'sm' | 'md' | 'lg';

    namespace App {
        // interface Error {}
        // interface Locals {}
        // interface PageData {}
        // interface PageState {}
        // interface Platform {}
    }
}

export {};
