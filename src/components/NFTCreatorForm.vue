<template>
  <v-form
    ref="form"
    v-model="valid"
    @submit.prevent="submitHandler"
  >
    <div>
      <v-sheet
        outlined
        rounded
        class="px-12 py-10 mb-1 d-flex justify-center align-center"
        style=" position:relative;"
        :style="{borderColor: !fileError?'':'#ff5252'}"
        min-height="200"
      >
        <v-btn
          v-if="file"
          icon
          absolute
          right
          top
          small
          @click.stop="file = null"
        >
          <v-icon small>
            mdi-close
          </v-icon>
        </v-btn>

        <div
          v-if="!file"
          class="text-center"
        >
          <p>
            PNG, JPG, GIF. Up to 2mb.
          </p>
          <v-btn
            @click="openFileExplorer"
          >
            Choose File
          </v-btn>
        </div>

        <img
          :src="filePreview"
          style="max-width:100%;max-height:300px;"
          class="rounded"
        >
      </v-sheet>

      <div
        class="text-caption error--text pl-3 mb-2"
        style="min-height:14px; line-height:12px; overflow:hidden;"
      >
        <v-scroll-y-transition>
          <div v-if="fileError">
            {{ fileError }}
          </div>
        </v-scroll-y-transition>
      </div>
    </div>

    <v-file-input
      ref="file"
      v-model="file"
      style="position:absolute; visibility:hidden;"
      accept=".png,.gif,.jpg,.jpeg"
      prepend-icon=""
      prepend-inner-icon=""
      required
      :rules="fileRules"
    />

    <v-text-field
      v-model="name"
      outlined
      dense
      label="Name"
      name="name"
      required
      :rules="nameRules"
      autocomplete="off"
    />

    <v-text-field
      v-model="description"
      outlined
      dense
      name="description"
      required
      :rules="descriptionRules"
      autocomplete="off"
    >
      <template v-slot:label>
        <div>
          Description <small>(optional)</small>
        </div>
      </template>
    </v-text-field>

    <v-btn
      block
      @click="advanced = !advanced"
    >
      <span v-if="!advanced">
        Show advanced settings
      </span>
      <span v-else>
        Hide advanced settings
      </span>
    </v-btn>
    <v-expand-transition>
      <div
        v-if="advanced"
      >
        <div class="mt-6">
          <v-text-field
            v-model="externalUrl"
            outlined
            dense
            name="externalUrl"
            :rules="externalUrlRules"
            autocomplete="off"
            label="External URL"
            placeholder="https://website.com"
          />
          <v-text-field
            v-model="royalties"
            outlined
            dense
            type="number"
            name="royalties"
            required
            :rules="royaltiesRules"
            autocomplete="off"
          >
            <template v-slot:label>
              <div>
                Royalties <small>%</small>
              </div>
            </template>
          </v-text-field>

          <v-subheader class="px-0">
            Collection
          </v-subheader>
          <div class="d-flex">
            <v-text-field
              v-model="collectionFamily"
              class="mr-2"
              outlined
              dense
              name="collectionFamily"
              :rules="collectionFamilyRules"
              autocomplete="off"
              label="Family"
              placeholder="Ex: Pigs on Solana"
              persistent-placeholder
            />
            <v-text-field
              v-model="collectionName"
              class="ml-2"
              outlined
              dense
              name="collectionName"
              :rules="collectionNameRules"
              autocomplete="off"
              label="Name"
              placeholder="Ex: Pigs on Solana Season #1"
              persistent-placeholder
            />
          </div>

          <v-subheader class="px-0">
            Attributes
          </v-subheader>
          <div
            v-for="(attribute, i) in attributes"
            :key="i"
            class="d-flex"
          >
            <v-text-field
              v-model="attributes[i].trait_type"
              class="mr-2"
              outlined
              dense
              autocomplete="off"
              placeholder="Color"
              prepend-icon="mdi-close"
              :rules="traitTypeRules"
              @click:prepend="attributesPlus(i)"
              @input="attributesWatcher"
            />
            <v-text-field
              v-model="attributes[i].value"
              class="ml-2"
              outlined
              dense
              autocomplete="off"
              placeholder="red"
              :rules="traitValueRules"
              @input="attributesWatcher"
            />
          </div>
        </div>
      </div>
    </v-expand-transition>

    <div class="d-flex mt-12">
      <n-f-t-creator-costs :file-size="fileSize || 0" />
      <v-spacer />
      <v-btn
        color="primary"
        type="submit"
        :disabled="!valid || !connected || loading || nftCreated"
        :loading="loading"
      >
        Create
      </v-btn>
    </div>
  </v-form>
</template>

<script>
import { PublicKey } from '@solana/web3.js';
import mintNFT from '../utils/mintNFT';
import NFTCreatorCosts from './NFTCreatorCosts.vue';
import { Creator, extendBorsh } from '../utils/metaplex/metadata';

export default {
  name: 'NFTCreatorForm',
  components: { NFTCreatorCosts },
  data: () => ({
    nftCreated: false,
    valid: true,
    advanced: false,
    name: '',
    description: '',
    supply: '',
    externalUrl: '',
    collectionName: '',
    collectionFamily: '',
    file: null,
    royalties: 1,
    attributes: [{ trait_type: '', value: '' }],
    nameRules: [],
    descriptionRules: [],
    supplyRules: [],
    fileRules: [],
    traitTypeRules: [],
    traitValueRules: [],
    externalUrlRules: [],
    collectionNameRules: [],
    collectionFamilyRules: [],
    royaltiesRules: [
      (v) => !!v || 'Royalties is required',
      (v) => (v && v <= 50) || 'Royalties must be less than 50%',
      (v) => (v && v >= 1) || 'Royalties must be a least 1%',
      (v) => (v && Number.isInteger(parseFloat(v))) || 'Royalties must be an integer',
    ],
    loading: false,
  }),
  computed: {
    connected: {
      get() {
        return this.$store.state.wallet.connected;
      },
    },
    address: {
      get() {
        return this.$store.state.wallet.connected;
      },
    },
    fileError() {
      for (let i = 0; i < this.fileRules.length; i += 1) {
        const rule = this.fileRules[i];
        const r = rule(this.file);
        if (r !== true) return r;
      }
      return null;
    },
    fileSize() {
      if (!this.file || !this.file.size) return null;
      return this.file.size;
    },
    filePreview() {
      if (!this.file || !this.file.size) return '';
      return URL.createObjectURL(this.file);
    },
  },
  methods: {
    getParsedAttributes() {
      const parsedAttributes = this.attributes.filter((attribute) => {
        if (!attribute.trait_type || attribute.trait_type === '') return false;
        if (!attribute.value || attribute.value === '') return false;
        return true;
      });
      return parsedAttributes;
    },
    attributesPlus(index) {
      if (this.attributes.length > 1) {
        this.attributes.splice(index, 1);
      } else if (this.attributes.length === 1) {
        this.$set(this.attributes, index, { trait_type: '', value: '' });
      }
    },
    attributesWatcher() {
      for (let i = 0; i < this.attributes.length; i += 1) {
        const attribute = this.attributes[i];
        if (attribute.trait_type === '' || attribute.value === '') return;
      }
      this.attributes.push({ trait_type: '', value: '' });
    },
    submitHandler() {
      this.nameRules = [
        (v) => !!v || 'Name is required',
        (v) => (v && v.length <= 50) || 'Name must be less than 50 characters',
        (v) => (v && v.length >= 3) || 'Name must be at least 3 characters',
        (v) => (v === '')
            || (new RegExp("^[A-Za-z0-9'?!.,:#áéíóúÁÉÍÓÚñÑäëïÖüÄËÏÖü_ -]+$", 'u').test(v))
            || 'Use standard characters',
      ];
      this.traitValueRules = [
        (v) => (v.length <= 20) || 'Trait value must be less than 20 characters',
        (v) => (v === '')
        || (new RegExp('^[A-Za-z0-9_-]+$', 'u').test(v))
        || 'Use standard characters',
      ];
      this.traitTypeRules = [
        (v) => (v.length <= 20) || 'Trait type must be less than 20 characters',
        (v) => (v === '')
        || (new RegExp('^[A-Za-z0-9_-]+$', 'u').test(v))
        || 'Use standard characters',
      ];
      this.collectionNameRules = [
        (v) => (v.length <= 40) || 'Collection name must be less than 40 characters',
        (v) => (v === '')
        || (new RegExp("^[A-Za-z0-9'?!.,:#áéíóúÁÉÍÓÚñÑäëïÖüÄËÏÖü_ -]+$", 'u').test(v))
        || 'Use standard characters',
      ];
      this.collectionFamilyRules = [
        (v) => (v.length <= 40) || 'Collection family must be less than 40 characters',
        (v) => (v === '')
        || (new RegExp("^[A-Za-z0-9'?!.,:#áéíóúÁÉÍÓÚñÑäëïÖüÄËÏÖü_ -]+$", 'u').test(v))
        || 'Use standard characters',
      ];
      this.externalUrlRules = [
        (v) => (v === '')
        || (new RegExp('^(ftp|http|https)://[^ "]+$', 'u').test(v))
        || 'External URL must be a valid link',
      ];
      this.descriptionRules = [
        (v) => (v.length <= 300) || 'Description must be less than 300 characters',
        (v) => (v === '')
            || (new RegExp("^[A-Za-z0-9'?!.,:#áéíóúÁÉÍÓÚñÑäëïÖüÄËÏÖü_ -]+$", 'u').test(v))
            || 'Use standard characters',
      ];
      this.supplyRules = [
        (v) => !!v || 'Supply is required',
        (v) => (v && v.length <= 1e12) || 'Supply must be less than 1,000,000,000,000',
        (v) => (v && v.length >= 1) || 'Supply must be a least 1',
        (v) => (v && Number.isInteger(parseFloat(v))) || 'Supply must be an integer',
      ];
      this.fileRules = [
        (v) => !!v || 'File is required',
        (v) => (v && v.size && v.size <= 2e6) || 'File must be less than 2mb',
      ];
      setTimeout(() => {
        if (this.$refs.form.validate()) {
          this.create();
        }
      }, 100);
    },
    async create() {
      this.loading = true;
      extendBorsh();
      let collection;
      if (this.collectionFamily !== '' || this.collectionName !== '') {
        collection = {
          name: this.collectionName,
          family: this.collectionFamily,
        };
      }
      const metadata = {
        animation_url: undefined,
        creators: [
          new Creator({
            address: new PublicKey(this.$wallet.publicKey.toString()),
            verified: true,
            share: 100,
          }),
        ],
        description: this.description || '',
        external_url: this.externalUrl,
        image: this.file.name,
        name: this.name,
        symbol: '',
        sellerFeeBasisPoints: this.royalties * 100,
        attributes: this.getParsedAttributes(),
        collection,
        properties: {
          category: 'image',
          files: [{ type: this.file.type, uri: this.file.name }],
        },
      };
      try {
        await mintNFT(this.$connection, this.$wallet, [this.file], metadata);
        this.nftCreated = true;
      } catch (error) {
        console.error(error);
        this.$toasted.show(error, {
          icon: 'alert-circle-outline',
          iconPack: 'mdi',
        });
      }
      this.loading = false;
    },
    openFileExplorer() {
      this.$refs.file.$refs.input.click();
    },
  },
};
</script>

<style>

</style>
