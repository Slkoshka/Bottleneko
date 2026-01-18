<script lang="ts">
    import { Card, CardBody, CardHeader } from '@sveltestrap/sveltestrap';
    import type { Props } from './DashboardCard';

    const props: Props = $props();
</script>

<Card class={`dashboard-card ${props.class ?? ''}`} style={`width: 450px; min-width: 300px; ${props.style ?? ''}`}>
    <CardHeader class="highlight">
        <span class="fs-5">
            {#if typeof props.title === 'string'}
                {props.title}
            {:else}
                {@render props.title?.()}
            {/if}
        </span>
    </CardHeader>
    <CardBody>
        {@render props.children?.()}
    </CardBody>
</Card>

<style>
    :global(.dashboard-card) :global(table) :global(tr) {
        width: 100%;
        height: 3em;
        vertical-align: middle;
    }

    :global(.dashboard-card) :global(td:nth-child(1)) {
        width: 7em;
    }

    @media only screen and (max-width: 600px) {
        :global(.dashboard-card) {
            width: 100% !important;
        }
    }
</style>
