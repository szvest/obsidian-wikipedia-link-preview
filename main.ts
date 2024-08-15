// main.ts
import { Plugin, MarkdownPostProcessorContext } from 'obsidian';

export default class WikipediaPreviewPlugin extends Plugin {
  private hidePreviewTimeout: number | null = null;

  async onload() {
    this.registerMarkdownPostProcessor(this.postProcessor.bind(this));
    document.addEventListener('mouseover', this.handleLinkHover.bind(this));
    document.addEventListener('mouseout', this.handleLinkMouseLeave.bind(this));
  }

  onunload() {
    document.removeEventListener('mouseover', this.handleLinkHover.bind(this));
    document.removeEventListener('mouseout', this.handleLinkMouseLeave.bind(this));
  }

  async postProcessor(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
    // No need to re-register event listeners here
  }

  async handleLinkHover(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.tagName === 'A' && target.matches('a[href^="https://en.wikipedia.org/wiki/"]')) {
      this.hidePreview();
      const link = target as HTMLAnchorElement;
      const href = link.href;
      const preview = await this.fetchWikipediaPreview(href);
      this.showPreview(link, preview);
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

      let previewContent = '';

      // Only add the image if it exists
      if (data.thumbnail?.source) {
        previewContent += `<img src="${data.thumbnail.source}" alt="Featured image" />`;
      }

      previewContent += `
        <h5>${data.description ?? 'No description available'}</h5>
        <p>${data.extract ?? 'No extract available'}</p>
      `;

      return previewContent;
    } catch (error) {
      console.error('Error fetching Wikipedia preview:', error);
      return 'Error fetching preview';
    }
  }

  showPreview(link: HTMLElement, content: string) {
    this.hidePreview();

    const previewEl = document.createElement('div');
    previewEl.classList.add('wikipedia-preview');

    // Create elements for each part of the preview content
    const titleEl = document.createElement('h5');
    const descriptionEl = document.createElement('p');
    const imageEl = document.createElement('img');

    // Set attributes and text content for each element
    if (content.includes('<img src=')) {
        const imgSrcRegex = /<img src="(.*?)"/;
        const imgSrcMatch = imgSrcRegex.exec(content);

        if (imgSrcMatch?.[1]) {
            imageEl.src = imgSrcMatch[1];
            imageEl.alt = "Featured image";
            previewEl.appendChild(imageEl);
        }
    }

    const titleRegex = /<h5>([\s\S]*?)<\/h5>/;
    const titleMatch = titleRegex.exec(content);

    if (titleMatch?.[1]) {
        titleEl.textContent = titleMatch[1].trim();
        previewEl.appendChild(titleEl);
    }

    const descriptionRegex = /<p>([\s\S]*?)<\/p>/;
    const descriptionMatch = descriptionRegex.exec(content);

    if (descriptionMatch?.[1]) {
        descriptionEl.textContent = descriptionMatch[1].trim();
        previewEl.appendChild(descriptionEl);
    }

    

    // Position the preview element
    const rect = link.getBoundingClientRect();
    previewEl.style.position = 'absolute';
    previewEl.style.left = `${rect.left}px`;
    previewEl.style.top = `${rect.bottom + window.scrollY}px`;

    // Append the preview element to the body
    document.body.appendChild(previewEl);
}

  hidePreview() {
    const preview = document.querySelector('.wikipedia-preview');
    if (preview) {
      preview.remove();
    }
  }
}
