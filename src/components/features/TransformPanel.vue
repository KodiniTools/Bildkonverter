<template>
  <aside class="transform-panel">
    <!-- Text Sektion (nur wenn Text ausgewählt) -->
    <div v-if="selectedText" class="panel-section text-section">
      <div class="section-header">
        <h3>
          <i class="fas fa-font"></i>
          {{ $t('textPanel.title', 'Text bearbeiten') }}
        </h3>
        <div class="text-history-controls">
          <button
            class="btn-icon-small"
            @click="$emit('undo-text')"
            :disabled="!canUndoText"
            :title="$t('textPanel.undo', 'Rückgängig')"
          >
            <i class="fas fa-undo"></i>
          </button>
          <button
            class="btn-icon-small"
            @click="$emit('redo-text')"
            :disabled="!canRedoText"
            :title="$t('textPanel.redo', 'Wiederherstellen')"
          >
            <i class="fas fa-redo"></i>
          </button>
        </div>
      </div>

      <!-- Text Inhalt -->
      <div class="control-group">
        <label>
          <i class="fas fa-i-cursor"></i>
          {{ $t('textPanel.content', 'Text') }}
        </label>
        <input
          type="text"
          :value="selectedText.content || selectedText.txt"
          @input="$emit('update:text-content', $event.target.value)"
          @change="$emit('save-text-history')"
          class="text-input"
          :placeholder="$t('textPanel.placeholder', 'Text eingeben...')"
        >
      </div>

      <!-- Schriftgröße -->
      <div class="control-group">
        <label>
          <i class="fas fa-text-height"></i>
          {{ $t('textPanel.fontSize', 'Schriftgröße') }}
          <span class="value">{{ selectedText.fontSize || selectedText.size || 32 }}px</span>
        </label>
        <input
          type="range"
          min="8"
          max="200"
          :value="selectedText.fontSize || selectedText.size || 32"
          @input="$emit('update:text-font-size', Number($event.target.value))"
          @change="$emit('save-text-history')"
          class="slider"
        >
      </div>

      <!-- Schriftart -->
      <div class="control-group">
        <label>
          <i class="fas fa-font"></i>
          {{ $t('textPanel.fontFamily', 'Schriftart') }}
        </label>
        <select
          :value="selectedText.fontFamily || 'Satoshi Regular'"
          @change="$emit('update:text-font-family', $event.target.value)"
          class="font-select"
        >
          <optgroup :label="$t('textPanel.customFonts', 'Benutzerdefinierte Schriften')">
            <option
              v-for="font in availableFonts"
              :key="font"
              :value="font"
              :style="{ fontFamily: font }"
            >
              {{ font }}
            </option>
          </optgroup>
          <optgroup :label="$t('textPanel.systemFonts', 'System-Schriften')">
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

      <!-- Textfarbe -->
      <div class="control-group">
        <label>
          <i class="fas fa-palette"></i>
          {{ $t('textPanel.color', 'Farbe') }}
        </label>
        <div class="color-picker-row">
          <input
            type="color"
            :value="selectedText.color || '#000000'"
            @input="$emit('update:text-color', $event.target.value)"
            @change="$emit('save-text-history')"
            class="color-input"
            :style="{ backgroundColor: selectedText.color || '#000000' }"
          >
          <input
            type="text"
            :value="selectedText.color || '#000000'"
            @input="$emit('update:text-color', $event.target.value)"
            @change="$emit('save-text-history')"
            class="color-text"
            maxlength="7"
          >
        </div>
      </div>

      <!-- Text-Umrandung (Stroke) -->
      <div class="control-group">
        <label>
          <i class="fas fa-border-style"></i>
          {{ $t('textPanel.strokeWidth', 'Umrandung') }}
          <span class="value">{{ selectedText.strokeWidth || 0 }}px</span>
        </label>
        <input
          type="range"
          min="0"
          max="50"
          :value="selectedText.strokeWidth || 0"
          @input="$emit('update:text-stroke-width', Number($event.target.value))"
          @change="$emit('save-text-history')"
          class="slider"
        >
        <div v-if="(selectedText.strokeWidth || 0) > 0" class="color-picker-row mt-2">
          <input
            type="color"
            :value="selectedText.strokeColor || '#000000'"
            @input="$emit('update:text-stroke-color', $event.target.value)"
            @change="$emit('save-text-history')"
            class="color-input"
            :style="{ backgroundColor: selectedText.strokeColor || '#000000' }"
          >
          <input
            type="text"
            :value="selectedText.strokeColor || '#000000'"
            @input="$emit('update:text-stroke-color', $event.target.value)"
            @change="$emit('save-text-history')"
            class="color-text"
            maxlength="7"
          >
        </div>
      </div>

      <!-- Text-Schatten -->
      <div class="control-group">
        <label>
          <i class="fas fa-clone"></i>
          {{ $t('textPanel.shadow', 'Schatten') }}
          <span class="value">{{ selectedText.shadowBlur || 0 }}px</span>
        </label>
        <input
          type="range"
          min="0"
          max="20"
          :value="selectedText.shadowBlur || 0"
          @input="$emit('update:text-shadow-blur', Number($event.target.value))"
          @change="$emit('save-text-history')"
          class="slider"
        >
        <div v-if="(selectedText.shadowBlur || 0) > 0" class="shadow-controls">
          <div class="shadow-offset-row">
            <div class="mini-control">
              <label>X</label>
              <input
                type="number"
                min="-50"
                max="50"
                :value="selectedText.shadowOffsetX ?? 2"
                @input="$emit('update:text-shadow-offset-x', Number($event.target.value))"
                @change="$emit('save-text-history')"
                class="mini-input"
              >
            </div>
            <div class="mini-control">
              <label>Y</label>
              <input
                type="number"
                min="-50"
                max="50"
                :value="selectedText.shadowOffsetY ?? 2"
                @input="$emit('update:text-shadow-offset-y', Number($event.target.value))"
                @change="$emit('save-text-history')"
                class="mini-input"
              >
            </div>
          </div>
          <div class="color-picker-row mt-2">
            <input
              type="color"
              :value="selectedText.shadowColor || '#000000'"
              @input="$emit('update:text-shadow-color', $event.target.value)"
              @change="$emit('save-text-history')"
              class="color-input"
              :style="{ backgroundColor: selectedText.shadowColor || '#000000' }"
            >
            <input
              type="text"
              :value="selectedText.shadowColor || '#000000'"
              @input="$emit('update:text-shadow-color', $event.target.value)"
              @change="$emit('save-text-history')"
              class="color-text"
              maxlength="7"
            >
          </div>
        </div>
      </div>

      <!-- Text-Rotation -->
      <div class="control-group">
        <label>
          <i class="fas fa-redo"></i>
          {{ $t('textPanel.rotation', 'Rotation') }}
          <span class="value">{{ selectedText.rotation || 0 }}°</span>
        </label>
        <input
          type="range"
          min="-180"
          max="180"
          :value="selectedText.rotation || 0"
          @input="$emit('update:text-rotation', Number($event.target.value))"
          @change="$emit('save-text-history')"
          class="slider"
        >
      </div>

      <!-- Text-Deckkraft -->
      <div class="control-group">
        <label>
          <i class="fas fa-adjust"></i>
          {{ $t('textPanel.opacity', 'Opacity') }}
          <span class="value">{{ selectedText.opacity !== undefined ? selectedText.opacity : 100 }}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="100"
          :value="selectedText.opacity !== undefined ? selectedText.opacity : 100"
          @input="$emit('update:text-opacity', Number($event.target.value))"
          @change="$emit('save-text-history')"
          class="slider"
        >
      </div>

      <!-- Text löschen -->
      <button
        class="transform-btn delete-btn"
        @click="$emit('delete-text')"
      >
        <i class="fas fa-trash"></i>
        <span>{{ $t('textPanel.delete', 'Text löschen') }}</span>
      </button>

      <!-- Auswahl aufheben -->
      <button
        class="transform-btn"
        @click="$emit('deselect-text')"
      >
        <i class="fas fa-times"></i>
        <span>{{ $t('textPanel.deselect', 'Auswahl aufheben') }}</span>
      </button>
    </div>

    <!-- Info wenn kein Text ausgewählt -->
    <div v-else-if="hasTexts" class="panel-section text-hint">
      <p class="hint-text">
        <i class="fas fa-mouse-pointer"></i>
        {{ $t('textPanel.selectHint', 'Klicken Sie auf einen Text im Bild, um ihn zu bearbeiten') }}
      </p>
    </div>

    <!-- Crop Sektion -->
    <div class="panel-section">
      <h3>
        <i class="fas fa-crop"></i>
        {{ $t('transform.crop.title') }}
      </h3>

      <button
        class="transform-btn"
        :class="{ 'active': cropMode }"
        @click="$emit('toggle-crop')"
      >
        <i :class="cropMode ? 'fas fa-check' : 'fas fa-crop'"></i>
        <span>{{ cropMode ? $t('transform.crop.confirm') : $t('transform.crop.button') }}</span>
      </button>

      <!-- Seitenverhältnis Presets -->
      <div v-if="cropMode" class="aspect-ratio-section">
        <label class="aspect-label">
          <i class="fas fa-expand-arrows-alt"></i>
          {{ $t('transform.crop.aspectRatio') }}
        </label>
        <div class="aspect-ratio-grid">
          <button
            v-for="preset in aspectRatioPresets"
            :key="preset.id"
            class="aspect-btn"
            :class="{ 'active': selectedAspectRatio === preset.id }"
            @click="$emit('set-aspect-ratio', preset.id)"
            :title="getPresetLabel(preset)"
          >
            <i :class="'fas ' + preset.icon"></i>
            <span>{{ getPresetLabel(preset) }}</span>
          </button>
        </div>
      </div>

      <button
        v-if="hasCropped"
        class="transform-btn undo-btn"
        @click="$emit('undo-crop')"
      >
        <i class="fas fa-undo"></i>
        <span>{{ $t('transform.crop.undo') }}</span>
      </button>
    </div>

    <!-- Transform Sektion -->
    <div class="panel-section">
      <div class="section-header">
        <h3>
          <i class="fas fa-magic"></i>
          {{ $t('transform.title') }}
        </h3>
        <div class="transform-history-controls">
          <button
            class="btn-icon-small"
            @click="$emit('undo-transform')"
            :disabled="!canUndoTransform"
            :title="$t('transform.undo', 'Rückgängig')"
          >
            <i class="fas fa-undo"></i>
          </button>
          <button
            class="btn-icon-small"
            @click="$emit('redo-transform')"
            :disabled="!canRedoTransform"
            :title="$t('transform.redo', 'Wiederherstellen')"
          >
            <i class="fas fa-redo"></i>
          </button>
        </div>
      </div>

      <!-- Deckkraft -->
      <div class="control-group">
        <label>
          <span class="label-text">
            <i class="fas fa-adjust"></i>
            {{ $t('transform.opacity') }}
          </span>
        </label>
        <div class="slider-with-input">
          <input
            type="range"
            min="0"
            max="100"
            :value="transforms.opacity"
            @input="$emit('update:opacity', Number($event.target.value))"
            @change="$emit('commit-transform')"
            class="slider"
          >
          <div class="number-input-wrapper">
            <input
              type="number"
              min="0"
              max="100"
              :value="transforms.opacity"
              @input="$emit('update:opacity', Math.min(100, Math.max(0, Number($event.target.value))))"
              @change="$emit('commit-transform')"
              class="number-input"
            >
            <span class="unit">%</span>
          </div>
        </div>
      </div>

      <!-- Rotation -->
      <div class="control-group">
        <label>
          <span class="label-text">
            <i class="fas fa-redo"></i>
            {{ $t('transform.rotation') }}
          </span>
        </label>
        <div class="slider-with-input">
          <input
            type="range"
            min="-180"
            max="180"
            :value="transforms.rotation"
            @input="$emit('update:rotation', Number($event.target.value))"
            @change="$emit('commit-transform')"
            class="slider"
          >
          <div class="number-input-wrapper">
            <input
              type="number"
              min="-180"
              max="180"
              :value="transforms.rotation"
              @input="$emit('update:rotation', Math.min(180, Math.max(-180, Number($event.target.value))))"
              @change="$emit('commit-transform')"
              class="number-input"
            >
            <span class="unit">°</span>
          </div>
        </div>
      </div>

      <!-- Schnell-Rotation Buttons -->
      <div class="button-group">
        <button 
          class="quick-btn"
          @click="$emit('rotate-90-counter')"
          :title="$t('transform.rotationTooltip.counterClockwise')"
        >
          <i class="fas fa-undo"></i>
          90°
        </button>
        <button 
          class="quick-btn"
          @click="$emit('rotate-180')"
          :title="$t('transform.rotationTooltip.rotate180')"
        >
          <i class="fas fa-sync"></i>
          180°
        </button>
        <button 
          class="quick-btn"
          @click="$emit('rotate-90')"
          :title="$t('transform.rotationTooltip.clockwise')"
        >
          <i class="fas fa-redo"></i>
          90°
        </button>
      </div>

      <!-- Spiegeln -->
      <div class="button-group">
        <button
          class="quick-btn"
          :class="{ 'active': transforms.flipHorizontal }"
          @click="$emit('flip-horizontal')"
          :title="$t('transform.flip.horizontalTooltip')"
        >
          <i class="fas fa-arrows-alt-h"></i>
          {{ $t('transform.flip.horizontal') }}
        </button>
        <button
          class="quick-btn"
          :class="{ 'active': transforms.flipVertical }"
          @click="$emit('flip-vertical')"
          :title="$t('transform.flip.verticalTooltip')"
        >
          <i class="fas fa-arrows-alt-v"></i>
          {{ $t('transform.flip.vertical') }}
        </button>
      </div>

      <!-- Neigung/Skew -->
      <div class="control-group skew-section">
        <label>
          <span class="label-text">
            <i class="fas fa-italic"></i>
            {{ $t('transform.skew.title', 'Neigung') }}
          </span>
        </label>

        <!-- Skew X (Horizontal) -->
        <div class="skew-control-row">
          <label class="mini-label">
            <i class="fas fa-arrows-alt-h"></i>
            {{ $t('transform.skew.horizontal', 'Horizontal') }}
          </label>
          <div class="slider-with-input compact">
            <input
              type="range"
              min="-45"
              max="45"
              :value="transforms.skewX"
              @input="$emit('update:skew-x', Number($event.target.value))"
              @change="$emit('commit-transform')"
              class="slider"
            >
            <div class="number-input-wrapper">
              <input
                type="number"
                min="-45"
                max="45"
                :value="transforms.skewX"
                @input="$emit('update:skew-x', Math.min(45, Math.max(-45, Number($event.target.value))))"
                @change="$emit('commit-transform')"
                class="number-input"
              >
              <span class="unit">°</span>
            </div>
          </div>
        </div>

        <!-- Skew Y (Vertikal) -->
        <div class="skew-control-row">
          <label class="mini-label">
            <i class="fas fa-arrows-alt-v"></i>
            {{ $t('transform.skew.vertical', 'Vertikal') }}
          </label>
          <div class="slider-with-input compact">
            <input
              type="range"
              min="-45"
              max="45"
              :value="transforms.skewY"
              @input="$emit('update:skew-y', Number($event.target.value))"
              @change="$emit('commit-transform')"
              class="slider"
            >
            <div class="number-input-wrapper">
              <input
                type="number"
                min="-45"
                max="45"
                :value="transforms.skewY"
                @input="$emit('update:skew-y', Math.min(45, Math.max(-45, Number($event.target.value))))"
                @change="$emit('commit-transform')"
                class="number-input"
              >
              <span class="unit">°</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Zoom/Skalierung -->
      <div class="control-group">
        <label>
          <span class="label-text">
            <i class="fas fa-search-plus"></i>
            {{ $t('transform.zoom') }}
          </span>
        </label>
        <div class="slider-with-input">
          <input
            type="range"
            min="10"
            max="200"
            :value="transforms.scale"
            @input="$emit('update:scale', Number($event.target.value))"
            @change="$emit('commit-transform')"
            class="slider"
          >
          <div class="number-input-wrapper">
            <input
              type="number"
              min="10"
              max="200"
              :value="transforms.scale"
              @input="$emit('update:scale', Math.min(200, Math.max(10, Number($event.target.value))))"
              @change="$emit('commit-transform')"
              class="number-input"
            >
            <span class="unit">%</span>
          </div>
        </div>
      </div>

      <!-- Pan-Hinweis und Reset (nur bei Zoom > 100%) -->
      <div v-if="canPan" class="pan-info">
        <p class="pan-hint">
          <i class="fas fa-hand-paper"></i>
          {{ $t('transform.panHint', 'Leertaste + Ziehen oder Mausrad-Klick zum Verschieben') }}
        </p>
        <button
          v-if="hasPan"
          class="transform-btn pan-reset-btn"
          @click="$emit('reset-pan')"
        >
          <i class="fas fa-compress-arrows-alt"></i>
          <span>{{ $t('transform.resetPan', 'Ansicht zentrieren') }}</span>
        </button>
      </div>

      <!-- Ecken abrunden -->
      <div class="control-group">
        <label>
          <span class="label-text">
            <i class="fas fa-circle"></i>
            {{ $t('transform.borderRadius') }}
          </span>
        </label>
        <div class="slider-with-input">
          <input
            type="range"
            min="0"
            max="50"
            :value="transforms.borderRadius"
            @input="$emit('update:border-radius', Number($event.target.value))"
            @change="$emit('commit-transform')"
            class="slider"
          >
          <div class="number-input-wrapper">
            <input
              type="number"
              min="0"
              max="50"
              :value="transforms.borderRadius"
              @input="$emit('update:border-radius', Math.min(50, Math.max(0, Number($event.target.value))))"
              @change="$emit('commit-transform')"
              class="number-input"
            >
            <span class="unit">%</span>
          </div>
        </div>
        <p class="control-hint">{{ $t('transform.borderRadiusHint', '50% = vollständiger Kreis') }}</p>
      </div>

      <!-- Rahmen -->
      <div class="control-group">
        <label>
          <span class="label-text">
            <i class="fas fa-border-style"></i>
            {{ $t('transform.border') }}
          </span>
        </label>
        <div class="slider-with-input">
          <input
            type="range"
            min="0"
            max="20"
            :value="transforms.borderWidth"
            @input="$emit('update:border-width', Number($event.target.value))"
            @change="$emit('commit-transform')"
            class="slider"
          >
          <div class="number-input-wrapper">
            <input
              type="number"
              min="0"
              max="20"
              :value="transforms.borderWidth"
              @input="$emit('update:border-width', Math.min(20, Math.max(0, Number($event.target.value))))"
              @change="$emit('commit-transform')"
              class="number-input"
            >
            <span class="unit">px</span>
          </div>
        </div>

        <div v-if="transforms.borderWidth > 0" class="color-picker-group">
          <input
            type="color"
            :value="transforms.borderColor"
            @input="$emit('update:border-color', $event.target.value)"
            @change="$emit('commit-transform')"
            class="color-input"
          >
          <span class="color-label">{{ $t('transform.borderColor') }}</span>
        </div>
      </div>

      <!-- Schlagschatten (Drop Shadow) -->
      <div class="control-group shadow-section">
        <label class="shadow-toggle-label">
          <span class="label-text">
            <i class="fas fa-clone"></i>
            {{ $t('transform.shadow.title', 'Schlagschatten') }}
          </span>
          <button
            class="toggle-btn"
            :class="{ 'active': transforms.shadowEnabled }"
            @click="$emit('update:shadow-enabled', !transforms.shadowEnabled)"
          >
            <span class="toggle-slider"></span>
          </button>
        </label>

        <!-- Shadow Controls (nur sichtbar wenn aktiviert) -->
        <div v-if="transforms.shadowEnabled" class="shadow-controls-panel">
          <!-- Offset X -->
          <div class="shadow-control-row">
            <label class="mini-label">
              <i class="fas fa-arrows-alt-h"></i>
              {{ $t('transform.shadow.offsetX', 'X-Versatz') }}
            </label>
            <div class="slider-with-input compact">
              <input
                type="range"
                min="-50"
                max="50"
                :value="transforms.shadowOffsetX"
                @input="$emit('update:shadow-offset-x', Number($event.target.value))"
                @change="$emit('commit-transform')"
                class="slider"
              >
              <div class="number-input-wrapper">
                <input
                  type="number"
                  min="-50"
                  max="50"
                  :value="transforms.shadowOffsetX"
                  @input="$emit('update:shadow-offset-x', Math.min(50, Math.max(-50, Number($event.target.value))))"
                  @change="$emit('commit-transform')"
                  class="number-input"
                >
                <span class="unit">px</span>
              </div>
            </div>
          </div>

          <!-- Offset Y -->
          <div class="shadow-control-row">
            <label class="mini-label">
              <i class="fas fa-arrows-alt-v"></i>
              {{ $t('transform.shadow.offsetY', 'Y-Versatz') }}
            </label>
            <div class="slider-with-input compact">
              <input
                type="range"
                min="-50"
                max="50"
                :value="transforms.shadowOffsetY"
                @input="$emit('update:shadow-offset-y', Number($event.target.value))"
                @change="$emit('commit-transform')"
                class="slider"
              >
              <div class="number-input-wrapper">
                <input
                  type="number"
                  min="-50"
                  max="50"
                  :value="transforms.shadowOffsetY"
                  @input="$emit('update:shadow-offset-y', Math.min(50, Math.max(-50, Number($event.target.value))))"
                  @change="$emit('commit-transform')"
                  class="number-input"
                >
                <span class="unit">px</span>
              </div>
            </div>
          </div>

          <!-- Blur -->
          <div class="shadow-control-row">
            <label class="mini-label">
              <i class="fas fa-adjust"></i>
              {{ $t('transform.shadow.blur', 'Weichzeichner') }}
            </label>
            <div class="slider-with-input compact">
              <input
                type="range"
                min="0"
                max="100"
                :value="transforms.shadowBlur"
                @input="$emit('update:shadow-blur', Number($event.target.value))"
                @change="$emit('commit-transform')"
                class="slider"
              >
              <div class="number-input-wrapper">
                <input
                  type="number"
                  min="0"
                  max="100"
                  :value="transforms.shadowBlur"
                  @input="$emit('update:shadow-blur', Math.min(100, Math.max(0, Number($event.target.value))))"
                  @change="$emit('commit-transform')"
                  class="number-input"
                >
                <span class="unit">px</span>
              </div>
            </div>
          </div>

          <!-- Opacity -->
          <div class="shadow-control-row">
            <label class="mini-label">
              <i class="fas fa-eye"></i>
              {{ $t('transform.shadow.opacity', 'Deckkraft') }}
            </label>
            <div class="slider-with-input compact">
              <input
                type="range"
                min="0"
                max="100"
                :value="transforms.shadowOpacity"
                @input="$emit('update:shadow-opacity', Number($event.target.value))"
                @change="$emit('commit-transform')"
                class="slider"
              >
              <div class="number-input-wrapper">
                <input
                  type="number"
                  min="0"
                  max="100"
                  :value="transforms.shadowOpacity"
                  @input="$emit('update:shadow-opacity', Math.min(100, Math.max(0, Number($event.target.value))))"
                  @change="$emit('commit-transform')"
                  class="number-input"
                >
                <span class="unit">%</span>
              </div>
            </div>
          </div>

          <!-- Color -->
          <div class="shadow-control-row">
            <label class="mini-label">
              <i class="fas fa-palette"></i>
              {{ $t('transform.shadow.color', 'Farbe') }}
            </label>
            <div class="color-picker-row">
              <input
                type="color"
                :value="transforms.shadowColor"
                @input="$emit('update:shadow-color', $event.target.value)"
                @change="$emit('commit-transform')"
                class="color-input"
                :style="{ backgroundColor: transforms.shadowColor }"
              >
              <input
                type="text"
                :value="transforms.shadowColor"
                @input="$emit('update:shadow-color', $event.target.value)"
                @change="$emit('commit-transform')"
                class="color-text"
                maxlength="7"
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { availableFonts } from '@/assets/fonts/fontList.js'

const { t } = useI18n({ useScope: 'global' })

// System-Schriftarten als Fallback
const systemFonts = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Courier New'
]

// Alle Schriften kombinieren (benutzerdefiniert zuerst, dann System)
const allFonts = [...availableFonts, ...systemFonts]

// Hilfsfunktion für Preset-Labels mit Übersetzung
function getPresetLabel(preset) {
  // Verwende Übersetzung für 'free' und 'circle', sonst das Label
  if (preset.id === 'free' || preset.id === 'circle') {
    return t(`transform.crop.presets.${preset.id}`)
  }
  return preset.label
}

defineProps({
  cropMode: {
    type: Boolean,
    required: true
  },
  hasCropped: {
    type: Boolean,
    required: true
  },
  selectedAspectRatio: {
    type: String,
    default: 'free'
  },
  aspectRatioPresets: {
    type: Array,
    default: () => []
  },
  transforms: {
    type: Object,
    required: true
  },
  canPan: {
    type: Boolean,
    default: false
  },
  hasPan: {
    type: Boolean,
    default: false
  },
  selectedText: {
    type: Object,
    default: null
  },
  hasTexts: {
    type: Boolean,
    default: false
  },
  canUndoText: {
    type: Boolean,
    default: false
  },
  canRedoText: {
    type: Boolean,
    default: false
  },
  canUndoTransform: {
    type: Boolean,
    default: false
  },
  canRedoTransform: {
    type: Boolean,
    default: false
  }
})

defineEmits([
  'toggle-crop',
  'undo-crop',
  'set-aspect-ratio',
  'update:opacity',
  'update:rotation',
  'update:scale',
  'update:border-radius',
  'update:border-width',
  'update:border-color',
  // Shadow events
  'update:shadow-enabled',
  'update:shadow-offset-x',
  'update:shadow-offset-y',
  'update:shadow-blur',
  'update:shadow-color',
  'update:shadow-opacity',
  // Skew events
  'update:skew-x',
  'update:skew-y',
  'rotate-90',
  'rotate-90-counter',
  'rotate-180',
  'flip-horizontal',
  'flip-vertical',
  'reset-pan',
  'undo-transform',
  'redo-transform',
  'commit-transform',
  'update:text-content',
  'update:text-font-size',
  'update:text-font-family',
  'update:text-color',
  'update:text-rotation',
  'update:text-opacity',
  'update:text-stroke-width',
  'update:text-stroke-color',
  'update:text-shadow-blur',
  'update:text-shadow-offset-x',
  'update:text-shadow-offset-y',
  'update:text-shadow-color',
  'save-text-history',
  'undo-text',
  'redo-text',
  'delete-text',
  'deselect-text'
])
</script>

<style scoped>
.transform-panel {
  width: 280px;
  background: var(--color-bg-secondary, #f9fafb);
  border-left: 1px solid var(--color-border, #e5e7eb);
  overflow-y: auto;
  padding: 0.75rem;

  /* Sticky Sidebar - bleibt im Sichtfeld während Canvas scrollt */
  position: sticky;
  top: 0;
  max-height: calc(100vh - var(--external-nav-height, 50px) - var(--header-height, 60px) - 60px);
  align-self: flex-start;

  /* Moderne Scrollbar - gleich wie linke Sidebar */
  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 2px;

    &:hover {
      background: var(--color-text-light);
    }
  }
}

.panel-section {
  margin-bottom: 0.5rem;
  background: var(--color-bg, #ffffff);
  border-radius: 8px;
  border: 1px solid var(--color-border, #e5e7eb);
  padding: 0.75rem 1rem;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--color-primary, #3b82f6);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  &:last-child {
    margin-bottom: 0;
  }
}

.panel-section h3 {
  font-size: 0.7rem;
  margin-bottom: 0.75rem;
  color: var(--color-text-light, #6b7280);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  i {
    color: var(--color-primary, #3b82f6);
    font-size: 0.85rem;
    opacity: 0.8;
  }
}

/* Buttons - angeglichen an linke Sidebar Preset Buttons */
.transform-btn {
  width: 100%;
  padding: 0.65rem 0.75rem;
  background: var(--color-bg, #ffffff);
  border: 1.5px solid var(--color-border, #d1d5db);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: var(--color-text-primary, #111827);
  margin-bottom: 0.5rem;
  font-weight: 500;

  &:hover {
    border-color: var(--color-primary, #3b82f6);
    background: rgba(59, 130, 246, 0.05);
    transform: translateY(-1px);
  }

  &.active {
    background: linear-gradient(135deg, #4ade80, #22c55e);
    color: white;
    border-color: #22c55e;
    box-shadow: 0 2px 8px rgba(74, 222, 128, 0.3);

    &:hover {
      background: linear-gradient(135deg, #22c55e, #16a34a);
    }
  }

  &.undo-btn {
    border-color: #f59e0b;
    color: #f59e0b;

    &:hover {
      background: rgba(245, 158, 11, 0.1);
      border-color: #d97706;
      color: #d97706;
    }
  }

  &.apply-btn {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    border-color: #2563eb;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);

    &:hover {
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      transform: translateY(-1px);
    }
  }

  i {
    font-size: 0.85rem;
    opacity: 0.9;
  }

  span {
    flex: 1;
    text-align: left;
  }
}

/* Control Groups - angeglichen an linke Sidebar */
.control-group {
  margin-bottom: 0.875rem;

  label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.75rem;
    color: var(--color-text, #111827);
    margin-bottom: 0.375rem;
    font-weight: 500;
    opacity: 0.85;

    .label-text {
      display: flex;
      align-items: center;
    }

    i {
      margin-right: 0.5rem;
      color: var(--color-primary, #3b82f6);
      font-size: 0.8rem;
    }

    .value {
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--color-primary, #3b82f6);
      font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
      min-width: 40px;
      text-align: right;
      background: rgba(59, 130, 246, 0.08);
      padding: 2px 6px;
      border-radius: 4px;
    }
  }
}

/* Slider mit numerischem Eingabefeld */
.slider-with-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  .slider {
    flex: 1;
  }
}

.number-input-wrapper {
  display: flex;
  align-items: center;
  background: var(--color-bg, #ffffff);
  border: 1px solid var(--color-border, #d1d5db);
  border-radius: 4px;
  padding: 0 4px 0 0;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--color-primary, #3b82f6);
  }

  &:focus-within {
    border-color: var(--color-primary, #3b82f6);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }

  .number-input {
    width: 42px;
    padding: 4px 2px 4px 6px;
    border: none;
    background: transparent;
    font-size: 0.75rem;
    font-weight: 600;
    font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
    color: var(--color-primary, #3b82f6);
    text-align: right;
    -moz-appearance: textfield;

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    &:focus {
      outline: none;
    }
  }

  .unit {
    font-size: 0.65rem;
    font-weight: 500;
    color: var(--color-text-secondary, #6b7280);
    margin-left: 1px;
  }
}

/* Dark Mode für number-input */
.dark-mode .number-input-wrapper {
  background: #374151;
  border-color: #4b5563;

  &:hover {
    border-color: var(--color-primary, #3b82f6);
  }

  .number-input {
    color: var(--color-primary, #3b82f6);
  }

  .unit {
    color: #9ca3af;
  }
}

/* Slider Track Wrapper - angeglichen an linke Sidebar */
.slider-track {
  position: relative;
  height: 20px;
  display: flex;
  align-items: center;
}

/* Slider - angeglichen an linke Sidebar */
.slider {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: var(--color-border, #d1d5db);
  outline: none;
  -webkit-appearance: none;
  cursor: pointer;
  transition: all 0.15s ease;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--color-primary, #3b82f6);
    cursor: pointer;
    transition: all 0.15s ease;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
    border: 2px solid var(--color-bg, #ffffff);
  }

  &:hover::-webkit-slider-thumb {
    transform: scale(1.2);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
  }

  &:active::-webkit-slider-thumb {
    transform: scale(1.1);
    background: var(--color-primary, #3b82f6);
  }

  &::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--color-primary, #3b82f6);
    cursor: pointer;
    border: 2px solid var(--color-bg, #ffffff);
    transition: all 0.15s ease;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  }

  &:hover::-moz-range-thumb {
    transform: scale(1.2);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
  }

  &::-moz-range-track {
    background: var(--color-border, #d1d5db);
    border-radius: 2px;
    height: 4px;
  }
}

.quick-btn {
  flex: 1;
  padding: 0.65rem 0.5rem;
  background: var(--color-bg, #ffffff);
  border: 1.5px solid var(--color-border, #d1d5db);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.75rem;
  color: var(--color-text-primary, #111827);
  font-weight: 500;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;

  &:hover {
    border-color: var(--color-primary, #3b82f6);
    background: rgba(59, 130, 246, 0.05);
    transform: translateY(-1px);
  }

  &.active {
    background: var(--color-primary, #3b82f6);
    color: white;
    border-color: var(--color-primary, #3b82f6);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  }

  i {
    font-size: 1.1rem;
    opacity: 0.9;
  }
}

/* Button Groups - wie Presets Grid */
.button-group {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.875rem;
}

/* Aspect Ratio Section */
.aspect-ratio-section {
  margin: 0.75rem 0;
  padding-top: 0.5rem;
  border-top: 1px dashed var(--color-border, #e5e7eb);
}

.aspect-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-text-light, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-bottom: 0.5rem;

  i {
    color: var(--color-primary, #3b82f6);
    font-size: 0.75rem;
  }
}

.aspect-ratio-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.35rem;
}

.aspect-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  padding: 0.5rem 0.25rem;
  background: var(--color-bg, #ffffff);
  border: 1.5px solid var(--color-border, #d1d5db);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.65rem;
  color: var(--color-text-primary, #111827);
  font-weight: 500;

  i {
    font-size: 0.85rem;
    opacity: 0.8;
  }

  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  &:hover {
    border-color: var(--color-primary, #3b82f6);
    background: rgba(59, 130, 246, 0.05);
    transform: translateY(-1px);
  }

  &.active {
    background: var(--color-primary, #3b82f6);
    color: white;
    border-color: var(--color-primary, #3b82f6);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);

    i {
      opacity: 1;
    }
  }
}

.dark-mode .aspect-ratio-section {
  border-top-color: #4b5563;
}

.dark-mode .aspect-label {
  color: #9ca3af;
}

.dark-mode .aspect-btn {
  background: #374151;
  border-color: #4b5563;
  color: #f9fafb;

  &:hover {
    background: #4b5563;
    border-color: var(--color-primary, #3b82f6);
  }

  &.active {
    background: var(--color-primary, #3b82f6);
    border-color: var(--color-primary, #3b82f6);
  }
}

/* Color Picker - angeglichen an linke Sidebar */
.color-picker-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.color-input {
  width: 40px;
  height: 32px;
  padding: 2px;
  border: 1px solid var(--color-border, #d1d5db);
  border-radius: 4px;
  cursor: pointer;
  background: var(--color-bg, #ffffff);
  transition: border-color 0.2s ease;

  &:hover {
    border-color: var(--color-primary, #3b82f6);
  }

  &::-webkit-color-swatch-wrapper {
    padding: 2px;
  }

  &::-webkit-color-swatch {
    border: none;
    border-radius: 2px;
  }
}

.color-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary, #6b7280);
  font-weight: 500;
}

.control-hint {
  font-size: 0.7rem;
  color: var(--color-text-secondary, #6b7280);
  margin-top: 0.35rem;
  font-style: italic;
  opacity: 0.8;
}

/* Dark Mode - angeglichen an linke Sidebar */
.dark-mode .transform-panel {
  background: var(--color-bg-secondary, #1f2937);
  border-left-color: #374151;
}

.dark-mode .panel-section {
  background: var(--color-bg, #1a1a2e);
  border-color: #374151;

  &:hover {
    border-color: var(--color-primary, #3b82f6);
  }
}

.dark-mode .panel-section h3 {
  color: #9ca3af;
}

.dark-mode .transform-btn {
  background: #374151;
  border-color: #4b5563;
  color: #f9fafb;

  &:hover {
    background: #4b5563;
    border-color: var(--color-primary, #3b82f6);
  }
}

.dark-mode .quick-btn {
  background: #374151;
  border-color: #4b5563;
  color: #f9fafb;

  &:hover {
    background: #4b5563;
    border-color: var(--color-primary, #3b82f6);
  }
}

.dark-mode .control-group label {
  color: #f9fafb;

  .value {
    color: var(--color-primary, #3b82f6);
    background: rgba(59, 130, 246, 0.15);
  }
}

.dark-mode .slider {
  background: #4b5563;

  &::-webkit-slider-thumb {
    border-color: #374151;
  }

  &::-moz-range-thumb {
    border-color: #374151;
  }
}

.dark-mode .color-input {
  border-color: #4b5563;
}

/* Text Section - hervorgehobene Section */
.text-section {
  background: rgba(59, 130, 246, 0.03);
  border: 1px solid rgba(59, 130, 246, 0.25);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;

  &:hover {
    border-color: rgba(59, 130, 246, 0.4);
    box-shadow: 0 2px 12px rgba(59, 130, 246, 0.08);
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;

  h3 {
    margin-bottom: 0;
  }
}

.text-history-controls,
.transform-history-controls {
  display: flex;
  gap: 4px;
}

.btn-icon-small {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg, #ffffff);
  border: 1.5px solid var(--color-border, #d1d5db);
  border-radius: 6px;
  cursor: pointer;
  color: var(--color-text-primary, #333);
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: var(--color-primary, #3b82f6);
    color: white;
    border-color: var(--color-primary, #3b82f6);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  i {
    font-size: 12px;
  }
}

.dark-mode .btn-icon-small {
  background: #374151;
  border-color: #4b5563;
  color: #f9fafb;

  &:hover:not(:disabled) {
    background: var(--color-primary, #3b82f6);
    border-color: var(--color-primary, #3b82f6);
  }
}

.text-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border, #d1d5db);
  border-radius: 6px;
  font-size: 0.85rem;
  background: var(--color-bg, #ffffff);
  color: var(--color-text-primary, #111827);
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--color-primary, #3b82f6);
  }

  &:focus {
    outline: none;
    border-color: var(--color-primary, #3b82f6);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
}

.font-select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border, #d1d5db);
  border-radius: 6px;
  font-size: 0.85rem;
  background: var(--color-bg, #ffffff);
  color: var(--color-text-primary, #111827);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--color-primary, #3b82f6);
  }

  &:focus {
    outline: none;
    border-color: var(--color-primary, #3b82f6);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
}

.color-picker-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;

  &.mt-2 {
    margin-top: 0.5rem;
  }

  .color-text {
    flex: 1;
    padding: 0.4rem 0.6rem;
    font-size: 0.8rem;
    font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
    border: 1px solid var(--color-border, #d1d5db);
    border-radius: 4px;
    background: var(--color-bg, #ffffff);
    color: var(--color-text-primary, #111827);
    text-transform: uppercase;
    transition: all 0.2s ease;

    &:hover {
      border-color: var(--color-primary, #3b82f6);
    }

    &:focus {
      outline: none;
      border-color: var(--color-primary, #3b82f6);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  }
}

/* Color Preview Tile */
.color-preview {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: 2px solid var(--color-border, #d1d5db);
  flex-shrink: 0;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* Shadow Controls */
.shadow-controls {
  margin-top: 0.5rem;
}

.shadow-offset-row {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.mini-control {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.4rem;

  label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-secondary, #6b7280);
    min-width: 14px;
  }

  .mini-input {
    flex: 1;
    padding: 0.35rem 0.5rem;
    font-size: 0.8rem;
    border: 1px solid var(--color-border, #d1d5db);
    border-radius: 4px;
    background: var(--color-bg, #ffffff);
    color: var(--color-text-primary, #111827);
    width: 100%;
    max-width: 70px;

    &:focus {
      outline: none;
      border-color: var(--color-primary, #3b82f6);
    }
  }
}

.dark-mode .mini-control .mini-input {
  background: #374151;
  border-color: #4b5563;
  color: #f9fafb;
}

.delete-btn {
  border-color: #ef4444 !important;
  color: #ef4444 !important;

  &:hover {
    background: rgba(239, 68, 68, 0.1) !important;
    border-color: #dc2626 !important;
    color: #dc2626 !important;
  }
}

.text-hint {
  background: rgba(59, 130, 246, 0.05);
  border: 1px dashed rgba(59, 130, 246, 0.3);
  border-radius: 8px;
  padding: 0.75rem 1rem;
}

.hint-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--color-text-secondary, #6b7280);
  margin: 0;
  line-height: 1.4;

  i {
    color: var(--color-primary, #3b82f6);
    font-size: 0.9rem;
  }
}

/* Dark Mode Text Section */
.dark-mode .text-section {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
}

.dark-mode .text-input,
.dark-mode .font-select {
  background: #374151;
  border-color: #4b5563;
  color: #f9fafb;
}

.dark-mode .color-picker-row .color-text {
  background: #374151;
  border-color: #4b5563;
  color: #f9fafb;
}

.dark-mode .text-hint {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
}

/* Pan Info Styles */
.pan-info {
  background: rgba(74, 222, 128, 0.1);
  border: 1px dashed rgba(74, 222, 128, 0.4);
  border-radius: 6px;
  padding: 0.75rem;
  margin-bottom: 1rem;
}

.pan-hint {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--color-text-secondary, #6b7280);
  margin: 0 0 0.5rem 0;
  line-height: 1.4;

  i {
    color: #22c55e;
    font-size: 0.9rem;
    margin-top: 0.1rem;
  }
}

.pan-reset-btn {
  border-color: #22c55e !important;
  color: #22c55e !important;

  &:hover {
    background: rgba(34, 197, 94, 0.1) !important;
    border-color: #16a34a !important;
    color: #16a34a !important;
  }
}

.dark-mode .pan-info {
  background: rgba(74, 222, 128, 0.15);
  border-color: rgba(74, 222, 128, 0.3);
}

.dark-mode .pan-hint {
  color: #9ca3af;
}

/* Shadow Section Styles */
.shadow-section {
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px dashed var(--color-border, #e5e7eb);
}

.shadow-toggle-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 0.5rem;
}

.toggle-btn {
  position: relative;
  width: 44px;
  height: 24px;
  background: var(--color-border, #d1d5db);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 2px;

  &.active {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
  }

  .toggle-slider {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    transition: transform 0.3s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  &.active .toggle-slider {
    transform: translateX(20px);
  }
}

.shadow-controls-panel {
  background: rgba(59, 130, 246, 0.05);
  border: 1px solid rgba(59, 130, 246, 0.15);
  border-radius: 8px;
  padding: 0.75rem;
  margin-top: 0.5rem;
}

.shadow-control-row {
  margin-bottom: 0.75rem;

  &:last-child {
    margin-bottom: 0;
  }
}

.mini-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.7rem;
  color: var(--color-text-secondary, #6b7280);
  margin-bottom: 0.35rem;
  font-weight: 500;

  i {
    color: var(--color-primary, #3b82f6);
    font-size: 0.7rem;
    opacity: 0.8;
  }
}

.slider-with-input.compact {
  gap: 0.4rem;

  .slider {
    flex: 1;
  }

  .number-input-wrapper {
    .number-input {
      width: 38px;
      padding: 3px 2px 3px 5px;
      font-size: 0.7rem;
    }

    .unit {
      font-size: 0.6rem;
    }
  }
}

/* Dark Mode Shadow Styles */
.dark-mode .shadow-section {
  border-top-color: #4b5563;
}

.dark-mode .toggle-btn {
  background: #4b5563;

  &.active {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
  }
}

.dark-mode .shadow-controls-panel {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.25);
}

.dark-mode .mini-label {
  color: #9ca3af;
}

/* Skew Section Styles */
.skew-section {
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px dashed var(--color-border, #e5e7eb);
}

.skew-control-row {
  margin-bottom: 0.5rem;

  &:last-child {
    margin-bottom: 0;
  }
}

.dark-mode .skew-section {
  border-top-color: #4b5563;
}
</style>
