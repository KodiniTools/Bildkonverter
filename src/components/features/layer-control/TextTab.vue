<template>
  <!-- TEXT TAB -->
  <div v-show="activeTab === 'text'" class="tab-content">
    <!-- Add Text Button -->
    <div class="panel-section">
      <div class="section-content">
        <button class="btn btn-primary btn-full" @click="addText">
          <i class="fas fa-plus"></i>
          {{ $t('layerPanel.text.addButton') }}
        </button>
      </div>
    </div>

    <!-- Text Liste -->
    <div v-if="imageStore.texts && imageStore.texts.length > 0" class="panel-section">
      <div class="section-header section-header--static">
        <i class="section-icon fas fa-list"></i>
        {{ $t('layerPanel.text.listTitle') }} ({{ imageStore.texts.length }})
      </div>
      <div class="section-content">
        <div class="text-list">
          <div
            v-for="text in imageStore.texts"
            :key="text.id"
            class="text-item"
            :class="{ selected: text.id === selectedTextId }"
            @click="selectText(text.id)"
          >
            <div
              class="text-color-swatch"
              :style="{ backgroundColor: text.color || '#000000' }"
            ></div>
            <div class="text-info">
              <span class="text-content">{{ text.content || text.txt || 'Text' }}</span>
              <span class="text-meta">{{ text.fontSize || 32 }}px</span>
            </div>
            <button
              class="icon-btn"
              :title="$t('layerPanel.layers.delete')"
              @click.stop="deleteText(text.id)"
            >
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Ausgewählter Text Eigenschaften -->
    <div v-if="selectedText" class="panel-section">
      <div class="section-header section-header--static">
        <i class="section-icon fas fa-edit"></i>
        {{ $t('layerPanel.text.editTitle') }}
      </div>
      <div class="section-content">
        <div class="control-group">
          <label>{{ $t('layerPanel.text.content') }}</label>
          <input
            type="text"
            :value="selectedText.content || selectedText.txt"
            class="text-input"
            @input="updateTextProperty('content', $event.target.value)"
          />
        </div>

        <div class="control-group">
          <label>{{ $t('layerPanel.text.fontSize') }}: {{ selectedText.fontSize || 32 }}px</label>
          <input
            type="range"
            min="8"
            max="200"
            :value="selectedText.fontSize || 32"
            @input="updateTextProperty('fontSize', parseInt($event.target.value))"
          />
        </div>

        <div class="control-group">
          <label>{{ $t('layerPanel.text.fontFamily') }}</label>
          <select
            :value="selectedText.fontFamily || 'Arial'"
            class="form-select font-select"
            @change="updateTextProperty('fontFamily', $event.target.value)"
          >
            <optgroup :label="$t('layerPanel.text.customFonts')">
              <option
                v-for="font in availableFonts"
                :key="font"
                :value="font"
                :style="{ fontFamily: font }"
              >
                {{ font }}
              </option>
            </optgroup>
            <optgroup :label="$t('layerPanel.text.systemFonts')">
              <option
                v-for="font in systemFonts"
                :key="font"
                :value="font"
                :style="{ fontFamily: font }"
              >
                {{ font }}
              </option>
            </optgroup>
          </select>
        </div>

        <div class="control-group">
          <label>{{ $t('layerPanel.text.color') }}</label>
          <div class="color-picker-row">
            <input
              type="color"
              :value="selectedText.color || '#000000'"
              class="color-input"
              @input="updateTextProperty('color', $event.target.value)"
            />
            <input
              type="text"
              :value="selectedText.color || '#000000'"
              class="color-text-input"
              maxlength="7"
              @input="updateTextProperty('color', $event.target.value)"
            />
          </div>
        </div>

        <div class="control-group">
          <label>{{ $t('layerPanel.text.opacity') }}: {{ selectedText.opacity || 100 }}%</label>
          <input
            type="range"
            min="0"
            max="100"
            :value="selectedText.opacity || 100"
            @input="updateTextProperty('opacity', parseInt($event.target.value))"
          />
        </div>

        <div class="control-group">
          <label>{{ $t('layerPanel.text.rotation') }}: {{ selectedText.rotation || 0 }}°</label>
          <input
            type="range"
            min="-180"
            max="180"
            :value="selectedText.rotation || 0"
            @input="updateTextProperty('rotation', parseInt($event.target.value))"
          />
        </div>

        <!-- Text Kontur -->
        <h4 class="subsection-title">{{ $t('layerPanel.text.stroke') }}</h4>
        <div class="control-group">
          <label
            >{{ $t('layerPanel.text.strokeWidth') }}: {{ selectedText.strokeWidth || 0 }}px</label
          >
          <input
            type="range"
            min="0"
            max="20"
            :value="selectedText.strokeWidth || 0"
            @input="updateTextProperty('strokeWidth', parseInt($event.target.value))"
          />
        </div>

        <div v-if="(selectedText.strokeWidth || 0) > 0" class="control-group">
          <label>{{ $t('layerPanel.text.strokeColor') }}</label>
          <div class="color-picker-row">
            <input
              type="color"
              :value="selectedText.strokeColor || '#ffffff'"
              class="color-input"
              @input="updateTextProperty('strokeColor', $event.target.value)"
            />
            <input
              type="text"
              :value="selectedText.strokeColor || '#ffffff'"
              class="color-text-input"
              maxlength="7"
              @input="updateTextProperty('strokeColor', $event.target.value)"
            />
          </div>
        </div>

        <!-- Text Schatten -->
        <h4 class="subsection-title">{{ $t('layerPanel.text.textShadow') }}</h4>
        <div class="control-group">
          <label
            >{{ $t('layerPanel.text.shadowBlur') }}: {{ selectedText.shadowBlur || 0 }}px</label
          >
          <input
            type="range"
            min="0"
            max="30"
            :value="selectedText.shadowBlur || 0"
            @input="updateTextProperty('shadowBlur', parseInt($event.target.value))"
          />
        </div>

        <template v-if="(selectedText.shadowBlur || 0) > 0">
          <div class="control-group">
            <label
              >{{ $t('layerPanel.text.shadowX') }}: {{ selectedText.shadowOffsetX || 2 }}px</label
            >
            <input
              type="range"
              min="-20"
              max="20"
              :value="selectedText.shadowOffsetX || 2"
              @input="updateTextProperty('shadowOffsetX', parseInt($event.target.value))"
            />
          </div>
          <div class="control-group">
            <label
              >{{ $t('layerPanel.text.shadowY') }}: {{ selectedText.shadowOffsetY || 2 }}px</label
            >
            <input
              type="range"
              min="-20"
              max="20"
              :value="selectedText.shadowOffsetY || 2"
              @input="updateTextProperty('shadowOffsetY', parseInt($event.target.value))"
            />
          </div>
          <div class="control-group">
            <label>{{ $t('layerPanel.text.shadowColor') }}</label>
            <div class="color-picker-row">
              <input
                type="color"
                :value="selectedText.shadowColor || '#000000'"
                class="color-input"
                @input="updateTextProperty('shadowColor', $event.target.value)"
              />
              <input
                type="text"
                :value="selectedText.shadowColor || '#000000'"
                class="color-text-input"
                maxlength="7"
                @input="updateTextProperty('shadowColor', $event.target.value)"
              />
            </div>
          </div>
        </template>

        <button class="btn btn-danger btn-full" @click="deleteText(selectedText.id)">
          <i class="fas fa-trash"></i>
          {{ $t('layerPanel.text.delete') }}
        </button>
      </div>
    </div>

    <!-- Keine Texte -->
    <div v-if="!imageStore.texts || imageStore.texts.length === 0" class="panel-section">
      <p class="hint-text">
        <i class="fas fa-font"></i>
        {{ $t('layerPanel.hints.addText') }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue';
import { LAYER_PANEL_KEY } from '@/composables/useLayerPanel';

const {
  imageStore,
  activeTab,
  selectedTextId,
  selectedText,
  availableFonts,
  systemFonts,
  addText,
  selectText,
  deleteText,
  updateTextProperty,
} = inject(LAYER_PANEL_KEY);
</script>

<style lang="scss" scoped>
@import './shared';
</style>
