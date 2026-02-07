<template>
  <header class="app-header">
    <div class="header-container">
      <!-- Logo & Title -->
      <div class="header-left">
        <router-link to="/" class="logo">
          <i class="fas fa-images"></i>
          <span class="logo-text">{{ $t('app.title') }}</span>
        </router-link>
      </div>

      <!-- Navigation -->
      <nav class="header-nav">
        <router-link 
          v-for="route in routes" 
          :key="route.path"
          :to="route.path"
          class="nav-link"
          :class="{ active: isActiveRoute(route.path) }"
        >
          <i :class="route.icon"></i>
          <span>{{ $t(route.label) }}</span>
        </router-link>
      </nav>

      <!-- Actions -->
      <div class="header-actions">
        <!-- Language Switcher -->
        <div class="language-switcher">
          <button 
            @click="toggleLanguage"
            class="btn-icon"
            :title="$t('app.changeLanguage')"
          >
            <i class="fas fa-language"></i>
            <span class="lang-code">{{ currentLocale.toUpperCase() }}</span>
          </button>
        </div>

        <!-- Theme Switcher -->
        <button 
          @click="toggleTheme"
          class="btn-icon"
          :title="$t('app.changeTheme')"
        >
          <i :class="isDarkTheme ? 'fas fa-sun' : 'fas fa-moon'"></i>
        </button>

        <!-- Mobile Menu Toggle -->
        <button 
          @click="toggleMobileMenu"
          class="btn-icon mobile-menu-toggle"
          :class="{ active: isMobileMenuOpen }"
        >
          <i :class="isMobileMenuOpen ? 'fas fa-times' : 'fas fa-bars'"></i>
        </button>
      </div>
    </div>

    <!-- Mobile Navigation -->
    <transition name="slide-down">
      <nav v-if="isMobileMenuOpen" class="mobile-nav">
        <router-link 
          v-for="route in routes" 
          :key="route.path"
          :to="route.path"
          class="mobile-nav-link"
          :class="{ active: isActiveRoute(route.path) }"
          @click="closeMobileMenu"
        >
          <i :class="route.icon"></i>
          <span>{{ $t(route.label) }}</span>
        </router-link>
      </nav>
    </transition>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useSettingsStore } from '@/stores/settingsStore'

const route = useRoute()
const settingsStore = useSettingsStore()

// State
const isMobileMenuOpen = ref(false)

// Navigation Routes
const routes = [
  { path: '/', icon: 'fas fa-home', label: 'nav.home' },
  { path: '/editor', icon: 'fas fa-edit', label: 'nav.editor' },
  { path: '/gallery', icon: 'fas fa-images', label: 'nav.gallery' },
  { path: '/guide', icon: 'fas fa-book-open', label: 'nav.guide' },
  { path: '/about', icon: 'fas fa-info-circle', label: 'nav.about' }
]

// Computed - Store als einzige Quelle der Wahrheit
const currentLocale = computed(() => settingsStore.locale)
const isDarkTheme = computed(() => settingsStore.theme === 'dark')

// Methods
function isActiveRoute(path) {
  return route.path === path
}

function toggleLanguage() {
  // NUR den Store ändern - App.vue's Watcher setzt die i18n locale
  const newLocale = settingsStore.locale === 'de' ? 'en' : 'de'
  settingsStore.setLocale(newLocale)
}

function toggleTheme() {
  const newTheme = settingsStore.theme === 'light' ? 'dark' : 'light'
  settingsStore.setTheme(newTheme)
}

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false
}
</script>

<style lang="scss" scoped>
.app-header {
  position: sticky;
  top: var(--external-nav-height, 50px); // Dynamisch gemessen in App.vue via ResizeObserver
  z-index: 1000;
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--header-height);
  padding: 0 var(--spacing-lg);
  max-width: 1400px;
  margin: 0 auto;

  @media (max-width: 768px) {
    height: var(--header-height-mobile);
    padding: 0 var(--spacing-md);
  }
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  text-decoration: none;
  color: var(--color-text-primary);
  font-size: 1.3rem;
  font-weight: 700;
  transition: color 0.2s ease;
  
  i {
    color: var(--color-primary);
    font-size: 1.5rem;
  }
  
  &:hover {
    color: var(--color-primary);
  }
  
  @media (max-width: 480px) {
    .logo-text {
      display: none;
    }
  }
}

.header-nav {
  display: flex;
  gap: var(--spacing-xs);
  
  @media (max-width: 768px) {
    display: none;
  }
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  text-decoration: none;
  color: var(--color-text-secondary);
  font-weight: 500;
  border-radius: var(--border-radius-md);
  transition: all 0.2s ease;
  
  i {
    font-size: 1rem;
  }
  
  &:hover {
    background: var(--color-light-blue);
    color: var(--color-primary);
  }
  
  &.active {
    background: var(--color-primary);
    color: #F5F4D6;
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.language-switcher {
  button {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }
  
  .lang-code {
    font-size: var(--font-size-sm);
    font-weight: 600;
  }
}

.btn-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: var(--color-light-blue);
    color: var(--color-primary);
  }
  
  i {
    font-size: 1.1rem;
  }
}

.mobile-menu-toggle {
  display: none;
  
  @media (max-width: 768px) {
    display: flex;
  }
  
  &.active {
    background: var(--color-light-blue);
    color: var(--color-primary);
  }
}

.mobile-nav {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-md);
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  
  @media (min-width: 769px) {
    display: none;
  }
}

.mobile-nav-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  text-decoration: none;
  color: var(--color-text-secondary);
  font-weight: 500;
  border-radius: var(--border-radius-md);
  transition: all 0.2s ease;
  
  i {
    font-size: 1.2rem;
    width: 24px;
  }
  
  &:hover {
    background: var(--color-light-blue);
    color: var(--color-primary);
  }
  
  &.active {
    background: var(--color-primary);
    color: #F5F4D6;
  }
}

// Transitions
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
