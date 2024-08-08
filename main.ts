// main.ts
import { Plugin, MarkdownPostProcessorContext } from 'obsidian';

export default class WikipediaPreviewPlugin extends Plugin {
  private hidePreviewTimeout: number | null = null;
  
  async onload() {
    this.registerMarkdownPostProcessor(this.postProcessor.bind(this));
  }

  async postProcessor(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
    document.addEventListener('mouseover', this.handleLinkHover.bind(this));
    document.addEventListener('mouseout', this.handleLinkMouseLeave.bind(this));
  }

  async handleLinkHover(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.tagName === 'A' && target.matches('a[href^="https://en.wikipedia.org/wiki/"]')) {
      // Remove existing previews
      this.hidePreview();
      
      const link = target as HTMLAnchorElement;
      const href = link.href;
      if (href.includes('wikipedia.org')) {
        const preview = await this.fetchWikipediaPreview(href);
        this.showPreview(link, preview);
      }
    } else if (target.classList.contains('wikipedia-preview') || target.closest('.wikipedia-preview')) {
      if (this.hidePreviewTimeout) {
        clearTimeout(this.hidePreviewTimeout);
        this.hidePreviewTimeout = null;
      }
    }
  }

  handleLinkMouseLeave(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (
      (target.tagName === 'A' && target.matches('a[href^="https://en.wikipedia.org/wiki/"]')) ||
      target.classList.contains('wikipedia-preview') ||
      target.closest('.wikipedia-preview')
    ) {
      this.startHidePreviewTimer();
    }
  }

  startHidePreviewTimer() {
    if (this.hidePreviewTimeout) {
      clearTimeout(this.hidePreviewTimeout);
    }
    this.hidePreviewTimeout = window.setTimeout(() => {
      this.hidePreview();
    }, 300);
  }

  async fetchWikipediaPreview(url: string): Promise<string> {
    const articleTitle = url.split('/wiki/')[1];
    const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${articleTitle}`;

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      return `
        <img src="${data.thumbnail?.source}" alt="Featured image" />
        <h5>${data.description}</h5>
        <p>${data.extract}</p>
      `;
    } catch (error) {
      console.error('Error fetching Wikipedia preview:', error);
      return 'Error fetching preview';
    }
  }

  showPreview(link: HTMLElement, content: string) {
    // Ensure only one preview is shown at a time
    this.hidePreview();

    const previewEl = document.createElement('div');
    previewEl.classList.add('wikipedia-preview');
    previewEl.innerHTML = content;

    const rect = link.getBoundingClientRect();
    previewEl.style.left = `${rect.left}px`;
    previewEl.style.top = `${rect.bottom + window.scrollY}px`;

    document.body.appendChild(previewEl);
  }

  hidePreview() {
    const preview = document.querySelector('.wikipedia-preview');
    if (preview) {
      preview.remove();
    }
  }
}
