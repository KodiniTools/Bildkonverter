<template>
  <div class="faq-view">
    <section class="hero-section">
      <h1>{{ $t('faq.title') }}</h1>
      <p class="subtitle">{{ $t('faq.subtitle') }}</p>
    </section>

    <section class="faq-section">
      <div class="faq-container">
        <div
          v-for="(faq, index) in faqs"
          :key="index"
          class="faq-item"
          :class="{ active: activeFaq === index }"
        >
          <h3 class="faq-heading">
            <button
              :id="`faq-question-${index}`"
              type="button"
              class="faq-question"
              :aria-expanded="activeFaq === index ? 'true' : 'false'"
              :aria-controls="`faq-answer-${index}`"
              @click="toggleFaq(index)"
            >
              <span class="faq-question__text">{{ $t(`faq.items.${faq.key}.question`) }}</span>
              <AppIcon :name="activeFaq === index ? 'chevron-up' : 'chevron-down'" :size="20" />
            </button>
          </h3>
          <div
            v-show="activeFaq === index"
            :id="`faq-answer-${index}`"
            class="faq-answer"
            role="region"
            :aria-labelledby="`faq-question-${index}`"
          >
            <p>{{ $t(`faq.items.${faq.key}.answer`) }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import AppIcon from '@/components/ui/AppIcon.vue';

const { t, locale } = useI18n({ useScope: 'global' });

const activeFaq = ref(null);

const faqs = [
  { key: 'formats' },
  { key: 'privacy' },
  { key: 'filters' },
  { key: 'crop' },
  { key: 'resize' },
  { key: 'download' },
];

const toggleFaq = (index) => {
  activeFaq.value = activeFaq.value === index ? null : index;
};

// FAQ JSON-LD Structured Data
const faqJsonLd = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: t(`faq.items.${faq.key}.question`),
    acceptedAnswer: {
      '@type': 'Answer',
      text: t(`faq.items.${faq.key}.answer`),
    },
  })),
}));

function updateFaqSchema() {
  let script = document.getElementById('faq-jsonld');
  if (!script) {
    script = document.createElement('script');
    script.id = 'faq-jsonld';
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(faqJsonLd.value);
}

function removeFaqSchema() {
  const script = document.getElementById('faq-jsonld');
  if (script) script.remove();
}

onMounted(updateFaqSchema);
onUnmounted(removeFaqSchema);
watch(locale, updateFaqSchema);
</script>

<style lang="scss" scoped>
// Inhaltsseite wie die FAQ-Seite des Collage Makers: flacher Kopf,
// Akkordeons als Panels (surface-1, 1-px-Rahmen, radius-lg) mit 1-px-Trenner.

.faq-view {
  min-height: 100vh;
  background: var(--ds-surface-0);
}

.hero-section {
  text-align: center;
  padding: var(--ds-space-16) var(--ds-space-8) var(--ds-space-8);

  h1 {
    font-size: var(--ds-text-3xl);
    font-weight: var(--ds-weight-bold);
    line-height: var(--ds-leading-tight);
    letter-spacing: var(--ds-tracking-tight);
    color: var(--ds-text);
    margin-bottom: var(--ds-space-4);
  }

  .subtitle {
    font-size: var(--ds-text-lg);
    line-height: var(--ds-leading);
    color: var(--ds-text-2);
    max-width: 600px;
    margin: 0 auto;
  }

  @media (max-width: 768px) {
    padding: var(--ds-space-8) var(--ds-space-4) var(--ds-space-6);

    h1 {
      font-size: var(--ds-text-2xl);
    }
  }

  @media (max-width: 480px) {
    .subtitle {
      font-size: var(--ds-text-md);
    }
  }
}

.faq-section {
  padding: var(--ds-space-8) var(--ds-space-8) var(--ds-space-16);

  @media (max-width: 768px) {
    padding: var(--ds-space-6) var(--ds-space-4) var(--ds-space-12);
  }

  @media (max-width: 480px) {
    padding: var(--ds-space-4) var(--ds-space-4) var(--ds-space-10);
  }
}

.faq-container {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
}

.faq-item {
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-lg);
  overflow: hidden;
  transition: border-color var(--ds-duration) var(--ds-ease);

  &:hover {
    border-color: var(--ds-border-strong);
  }

  &.active {
    border-color: var(--ds-border-strong);
  }
}

.faq-heading {
  margin: 0;
  font-size: var(--ds-text-lg);
  font-weight: var(--ds-weight-semibold);
  line-height: var(--ds-leading);
}

.faq-question {
  width: 100%;
  padding: var(--ds-space-5) var(--ds-space-6);
  border: none;
  background: transparent;
  color: var(--ds-text);
  font: inherit;
  text-align: left;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--ds-space-4);
  transition: background-color var(--ds-duration) var(--ds-ease);

  .faq-item:hover & {
    background: var(--ds-surface-2);
  }

  &:focus-visible {
    outline: none;
    // Innen liegender Ring, weil .faq-item overflow: hidden setzt
    box-shadow: inset 0 0 0 2px var(--ds-accent);
  }

  .app-icon {
    color: var(--ds-text-2);
  }

  @media (max-width: 768px) {
    padding: var(--ds-space-3) var(--ds-space-4);
    font-size: var(--ds-text-md);
  }
}

.faq-answer {
  padding: var(--ds-space-5) var(--ds-space-6);
  border-top: var(--ds-border-width) solid var(--ds-border);
  animation: faqFadeIn var(--ds-duration-slow) var(--ds-ease);

  p {
    font-size: var(--ds-text-lg);
    color: var(--ds-text-2);
    line-height: var(--ds-leading);
    margin: 0;
    white-space: pre-line;
  }

  @media (max-width: 768px) {
    padding: var(--ds-space-3) var(--ds-space-4);

    p {
      font-size: var(--ds-text-md);
    }
  }
}

@keyframes faqFadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}
</style>
