<script lang="ts">
    import { Button } from '@sveltestrap/sveltestrap';
    import type { Props } from './WizardNavigation';

    const props: Props = $props();
</script>

<hr />
<div class="d-flex justify-content-center mx-auto w-100">
    <Button size="lg" class="mx-2" style="min-width: 25%" disabled={!props.back} onclick={props.back} color="secondary"
        >Back</Button
    >
    <Button size="lg" class="mx-2" style="min-width: 25%" disabled={!props.next} onclick={props.next} color="primary"
        >Next</Button
    >
</div>
