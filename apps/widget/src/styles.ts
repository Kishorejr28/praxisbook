export function injectStyles(_color: string) {
  // Global styles are minimal — everything else lives in Shadow DOM
  const style = document.createElement("style");
  style.textContent = `
    #praxisbook-widget-host {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
    }
  `;
  document.head.appendChild(style);
}
