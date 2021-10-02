<template>
  <v-container
    fluid
    style="max-width:550px;"
    class="mb-12"
  >
    <v-img
      src="/logos/nft_creator/nft_creator_white.svg"
      height="55"
      contain
      class="mb-3"
    />
    <p class="text-center">
      An easy and quick way to create NFTs on Solana blockchain.<br>
      <h1>FOR FREE</h1>
      This is still in <code>BETA</code> you may lose your transaction fee.
    </p>

    <v-divider class="my-6" />
    <app-wallet-btn />
    <v-divider class="my-6" />

    <n-f-t-creator-form />
  </v-container>
</template>

<script>
import NFTCreatorForm from '@/components/NFTCreatorForm.vue';
import AppWalletBtn from '@/components/AppWalletBtn.vue';

export default {
  name: 'Home',
  components: {
    AppWalletBtn, NFTCreatorForm,
  },
};
</script>
