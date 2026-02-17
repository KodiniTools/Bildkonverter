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
          :class="{ 'active': activeFaq === index }"
          @click="toggleFaq(index)"
        >
          <div class="faq-question">
            <h3>{{ $t(`faq.items.${faq.key}.question`) }}</h3>
            <i class="fas" :class="activeFaq === index ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
          </div>
          <div class="faq-answer" v-show="activeFaq === index">
            <p>{{ $t(`faq.items.${faq.key}.answer`) }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n({ useScope: 'global' })

const activeFaq = ref(null)

const faqs = [
  { key: 'formats' },
  { key: 'privacy' },
  { key: 'filters' },
  { key: 'crop' },
  { key: 'resize' },
  { key: 'download' }
]

const toggleFaq = (index) => {
  activeFaq.value = activeFaq.value === index ? null : index
}

// FAQ JSON-LD Structured Data
const faqJsonLd = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  'mainEntity': faqs.map(faq => ({
    '@type': 'Question',
    'name': t(`faq.items.${faq.key}.question`),
    'acceptedAnswer': {
      '@type': 'Answer',
      'text': t(`faq.items.${faq.key}.answer`)
    }
  }))
}))

function updateFaqSchema() {
  let script = document.getElementById('faq-jsonld')
  if (!script) {
    script = document.createElement('script')
    script.id = 'faq-jsonld'
    script.type = 'application/ld+json'
    document.head.appendChild(script)
  }
  script.textContent = JSON.stringify(faqJsonLd.value)
}

function removeFaqSchema() {
  const script = document.getElementById('faq-jsonld')
  if (script) script.remove()
}

onMounted(updateFaqSchema)
onUnmounted(removeFaqSchema)
watch(locale, updateFaqSchema)
</script>

<style lang="scss" scoped>
.faq-view {
  min-height: 100vh;
}

.hero-section {
  text-align: center;
  padding: 4rem 2rem 2rem;
  background: linear-gradient(135deg, var(--color-accent-lighter) 0%, var(--color-bg-gradient) 50%, var(--color-bg) 100%);

  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: var(--spacing-md);
  }

  .subtitle {
    font-size: 1.1rem;
    color: var(--color-text-secondary);
    max-width: 600px;
    margin: 0 auto;
  }

  @media (max-width: 768px) {
    padding: 3rem 1.5rem 1.5rem;

    h1 {
      font-size: 2rem;
    }
  }

  @media (max-width: 480px) {
    h1 {
      font-size: 1.6rem;
    }

    .subtitle {
      font-size: 0.95rem;
    }
  }
}

.faq-section {
  padding: 3rem var(--spacing-xl) 5rem;

  @media (max-width: 768px) {
    padding: 2rem var(--spacing-md) 3rem;
  }

  @media (max-width: 480px) {
    padding: 1.5rem var(--spacing-sm) 2.5rem;
  }
}

.faq-container {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.faq-item {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    box-shadow: var(--shadow-md);
  }

  &.active {
    border-color: var(--color-primary);
    box-shadow: 0 4px 12px rgba(1, 79, 153, 0.15);
  }
}

.faq-question {
  padding: var(--spacing-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);

  h3 {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
  }

  i {
    font-size: 1rem;
    color: var(--color-primary);
    transition: transform 0.3s ease;
  }

  @media (max-width: 768px) {
    padding: var(--spacing-md);

    h3 {
      font-size: 1rem;
    }
  }

  @media (max-width: 480px) {
    padding: var(--spacing-sm) var(--spacing-md);

    h3 {
      font-size: 0.9rem;
    }
  }
}

.faq-answer {
  padding: 0 var(--spacing-lg) var(--spacing-lg);
  animation: fadeIn 0.3s ease;

  p {
    color: var(--color-text-secondary);
    line-height: 1.7;
    margin: 0;
    white-space: pre-line;
  }

  @media (max-width: 480px) {
    padding: 0 var(--spacing-md) var(--spacing-md);

    p {
      font-size: 0.9rem;
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
