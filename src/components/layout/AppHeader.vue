<template>
  <header class="app-header">
    <div class="header-container">
      <!-- Navigation -->
      <nav class="header-nav">
        <template v-for="navItem in routes" :key="navItem.path">
          <a
            v-if="navItem.external"
            :href="navItem.path"
            class="nav-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ $t(navItem.label) }}
          </a>
          <router-link
            v-else
            :to="navItem.path"
            class="nav-link"
            :class="{ active: isActiveRoute(navItem.path) }"
          >
            {{ $t(navItem.label) }}
          </router-link>
        </template>
      </nav>

      <!-- Actions -->
      <div class="header-actions">
        <!-- Mobile Menu Toggle -->
        <button
          class="btn-icon mobile-menu-toggle"
          :class="{ active: isMobileMenuOpen }"
          :aria-label="$t('nav.menu', 'Menü')"
          @click="toggleMobileMenu"
        >
          <AppIcon :name="isMobileMenuOpen ? 'times' : 'bars'" :size="20" />
        </button>
      </div>
    </div>

    <!-- Mobile Navigation -->
    <transition name="slide-down">
      <nav v-if="isMobileMenuOpen" class="mobile-nav">
        <template v-for="navItem in routes" :key="navItem.path">
          <a
            v-if="navItem.external"
            :href="navItem.path"
            class="mobile-nav-link"
            target="_blank"
            rel="noopener noreferrer"
            @click="closeMobileMenu"
          >
            {{ $t(navItem.label) }}
          </a>
          <router-link
            v-else
            :to="navItem.path"
            class="mobile-nav-link"
            :class="{ active: isActiveRoute(navItem.path) }"
            @click="closeMobileMenu"
          >
            {{ $t(navItem.label) }}
          </router-link>
        </template>
      </nav>
    </transition>
  </header>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import AppIcon from '@/components/ui/AppIcon.vue';

const route = useRoute();

// State
const isMobileMenuOpen = ref(false);

// Navigation Routes
// `external: true` → wird als <a target="_blank"> statt <router-link> gerendert
const routes = [
  { path: '/', label: 'nav.home' },
  { path: '/editor', label: 'nav.editor' },
  { path: '/gallery', label: 'nav.gallery' },
  { path: '/guide', label: 'nav.guide' },
  { path: '/faq', label: 'nav.faq' },
  { path: '/about', label: 'nav.about' },
  {
    path: 'https://kodinitools.com/blog/jpg-zu-webp-konvertieren/',
    label: 'nav.blog',
    external: true,
  },
];

// Methods
function isActiveRoute(path) {
  return route.path === path;
}

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false;
}
</script>

<style lang="scss" scoped>
/* Topbar wie im Collage Maker: sticky, 56 px, surface-1, 1-px-Rahmen unten,
   kein Schatten. Nav-Links = UiButton ghost (sm), aktiv = Auswahlzustand. */
.app-header {
  position: sticky;
  top: var(--external-nav-height, 50px); // Dynamisch gemessen in App.vue via ResizeObserver
  z-index: 1000;
  background: var(--ds-surface-1);
  border-bottom: var(--ds-border-width) solid var(--ds-border);
}

.header-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: var(--ds-topbar-height);
  padding: 0 var(--ds-space-6);
  max-width: 1400px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 0 var(--ds-space-4);
  }
}

.header-nav {
  display: flex;
  align-items: center;
  gap: var(--ds-space-1);

  @media (max-width: 768px) {
    display: none;
  }
}

/* UiButton ghost, Größe sm */
.nav-link {
  display: inline-flex;
  align-items: center;
  height: var(--ds-control-sm);
  padding: 0 var(--ds-space-3);
  border: var(--ds-border-width) solid transparent;
  border-radius: var(--ds-radius-sm);
  background: transparent;
  color: var(--ds-text-2);
  font-size: var(--ds-text-sm);
  font-weight: var(--ds-weight-medium);
  line-height: 1;
  white-space: nowrap;
  text-decoration: none;
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    border-color var(--ds-duration) var(--ds-ease),
    color var(--ds-duration) var(--ds-ease);

  &:hover {
    background: var(--ds-surface-2);
    color: var(--ds-text);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }

  &.active {
    background: var(--ds-accent-soft);
    border-color: var(--ds-accent);
    color: var(--ds-text);
  }
}

.header-actions {
  position: absolute;
  right: var(--ds-space-6);
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);

  @media (max-width: 768px) {
    right: var(--ds-space-4);
  }
}

/* UiIconButton ghost, 36 px, Icon 20 */
.btn-icon {
  width: var(--ds-control-md);
  height: var(--ds-control-md);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: var(--ds-border-width) solid transparent;
  background: transparent;
  color: var(--ds-text-2);
  border-radius: var(--ds-radius-md);
  cursor: pointer;
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    border-color var(--ds-duration) var(--ds-ease),
    color var(--ds-duration) var(--ds-ease);

  &:hover {
    background: var(--ds-surface-2);
    color: var(--ds-text);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }
}

.mobile-menu-toggle {
  display: none;

  @media (max-width: 768px) {
    display: flex;
  }

  &.active {
    background: var(--ds-surface-2);
    color: var(--ds-text);
  }
}

.mobile-nav {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  padding: var(--ds-space-2) var(--ds-space-4) var(--ds-space-4);
  border-top: var(--ds-border-width) solid var(--ds-border);
  background: var(--ds-surface-1);

  @media (min-width: 769px) {
    display: none;
  }
}

.mobile-nav-link {
  display: flex;
  align-items: center;
  min-height: var(--ds-row-height);
  padding: 0 var(--ds-space-3);
  border: var(--ds-border-width) solid transparent;
  border-radius: var(--ds-radius-md);
  color: var(--ds-text-2);
  font-size: var(--ds-text-md);
  font-weight: var(--ds-weight-medium);
  text-decoration: none;
  transition:
    background-color var(--ds-duration) var(--ds-ease),
    border-color var(--ds-duration) var(--ds-ease),
    color var(--ds-duration) var(--ds-ease);

  &:hover {
    background: var(--ds-surface-2);
    color: var(--ds-text);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }

  &.active {
    background: var(--ds-accent-soft);
    border-color: var(--ds-accent);
    color: var(--ds-text);
  }
}

// Mobile-Menü: Überblendung mit 8 px Weg
.slide-down-enter-active,
.slide-down-leave-active {
  transition:
    opacity var(--ds-duration-slow) var(--ds-ease),
    transform var(--ds-duration-slow) var(--ds-ease);
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
