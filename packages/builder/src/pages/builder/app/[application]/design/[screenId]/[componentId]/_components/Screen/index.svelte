<script>
  import GeneralPanel from "./GeneralPanel.svelte"
  import ThemePanel from "./ThemePanel.svelte"
  import { selectedScreen } from "@/stores/builder"
  import Panel from "@/components/design/Panel.svelte"
  import { capitalise } from "@/helpers"
  import { ActionButton, Layout } from "@budibase/bbui"

  let activeTab = "general"
  const tabs = ["general", "theme"]
</script>

{#if $selectedScreen}
  <Panel
    title={$selectedScreen.routing.route}
    icon={$selectedScreen.routing.route === "/" ? "Home" : "WebPage"}
    borderLeft
    wide
  >
    <div slot="panel-header-content">
      <div class="settings-tabs">
        {#each tabs as tab}
          <ActionButton
            size="M"
            quiet
            selected={activeTab === tab}
            on:click={() => {
              activeTab = tab
            }}
          >
            {capitalise(tab)}
          </ActionButton>
        {/each}
      </div>
    </div>
    <Layout gap="XS" paddingX="XL" paddingY="XL">
      {#if activeTab === "theme"}
        <ThemePanel />
      {:else}
        <GeneralPanel />
      {/if}
    </Layout>
  </Panel>
{/if}

<style>
  .settings-tabs {
    display: flex;
    gap: var(--spacing-s);
    padding: 0 var(--spacing-l);
    padding-bottom: var(--spacing-l);
  }
</style>
