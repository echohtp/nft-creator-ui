<template>
  <v-footer
    app
    absolute
    color="transparent"
    height="auto"
    class="mb-2"
  >
    <div class="d-flex justify-center align-center flex-grow-1">

      <v-divider
        vertical
        class="mx-2"
      />
      <v-btn
        icon
        href="https://www.metaplex.com/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <v-avatar size="24">
          <v-img :src="'/logos/misc/metaplex.png'" />
        </v-avatar>
      </v-btn>
    </div>
  </v-footer>
</template>

<script>
export default {
  name: 'AppFooter',
};
</script>
