<script lang="ts" context="module">
  type O = any
  type V = any
</script>

<script lang="ts" generics="O, V">
  import "@spectrum-css/fieldgroup/dist/index-vars.css"
  import "@spectrum-css/radio/dist/index-vars.css"
  import { createEventDispatcher } from "svelte"

  export let direction: "horizontal" | "vertical" = "vertical"
  export let value: V[] = []
  export let options: O[] = []
  export let disabled = false
  export let readonly = false
  export let getOptionLabel = (option: O) => `${option}`
  export let getOptionValue = (option: O) => option as unknown as V

  const dispatch = createEventDispatcher<{ change: V[] }>()

  const onChange = (optionValue: V) => {
    if (!value.includes(optionValue)) {
      dispatch("change", [...value, optionValue])
    } else {
      dispatch(
        "change",
        value.filter(x => x !== optionValue)
      )
    }
  }
</script>

<div class={`spectrum-FieldGroup spectrum-FieldGroup--${direction}`}>
  {#if options && Array.isArray(options)}
    {#each options as option}
      {@const optionValue = getOptionValue(option)}
      <div
        title={getOptionLabel(option)}
        class="spectrum-Checkbox spectrum-FieldGroup-item"
        class:readonly
      >
        <label
          class="spectrum-Checkbox spectrum-Checkbox--sizeM spectrum-FieldGroup-item"
        >
          <input
            on:change={() => onChange(optionValue)}
            type="checkbox"
            class="spectrum-Checkbox-input"
            checked={value.includes(optionValue)}
            {disabled}
          />
          <span class="spectrum-Checkbox-box">
            <svg
              class="spectrum-Icon spectrum-UIIcon-Checkmark100 spectrum-Checkbox-checkmark"
              focusable="false"
              aria-hidden="true"
            >
              <use xlink:href="#spectrum-css-icon-Checkmark100" />
            </svg>
          </span>
          <span class="spectrum-Checkbox-label">{getOptionLabel(option)}</span>
        </label>
      </div>
    {/each}
  {/if}
</div>

<style>
  .spectrum-Checkbox-input {
    opacity: 0;
  }
  .readonly {
    pointer-events: none;
  }
</style>
