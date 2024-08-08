import { Plugin, MarkdownPostProcessorContext } from 'obsidian';

export default class WikipediaPreviewPlugin extends Plugin {
  async onload() {
    this.registerMarkdownPostProcessor(this.postProcessor.bind(this));
  }

  async postProcessor(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
    document.addEventListener('mouseover', (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'A' && target.matches('a[href^="https://en.wikipedia.org/wiki/"]')) {
        this.handleLinkHover(event);
      }
    });

    document.addEventListener('mouseout', (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'A' && target.matches('a[href^="https://en.wikipedia.org/wiki/"]')) {
        this.handleLinkMouseLeave(event);
      }
    });
  }

  async handleLinkHover(event: MouseEvent) {
    const link = event.target as HTMLAnchorElement;
    const href = link.href;

    if (href.includes('wikipedia.org')) {
      const preview = await this.fetchWikipediaPreview(href);
      this.showPreview(link, preview);
    }
  }

  handleLinkMouseLeave(event: MouseEvent) {
    const relatedTarget = event.relatedTarget as HTMLElement;
    const preview = document.querySelector('.wikipedia-preview');

    // Check if the mouse is leaving the link and the preview
    if (relatedTarget !== preview && !preview?.contains(relatedTarget)) {
      this.hidePreview();
    }
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
    const previewEl = document.createElement('div');
    previewEl.classList.add('wikipedia-preview');
    previewEl.innerHTML = content;

    const rect = link.getBoundingClientRect();
    previewEl.style.position = 'absolute';
    previewEl.style.left = `${rect.left}px`;
    previewEl.style.top = `${rect.bottom}px`;

    document.body.appendChild(previewEl);
  }

  hidePreview() {
    const preview = document.querySelector('.wikipedia-preview');
    if (preview) {
      preview.remove();
    }
  }
}
