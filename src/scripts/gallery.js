export function initGallery() {
  const main = document.querySelector('main');
  const scenes = JSON.parse(main.dataset.scenes);
  let frame = document.querySelector('#scene');
  const previous = document.querySelector('#previous');
  const next = document.querySelector('#next');
  const announcement = document.querySelector('#announcement');
  let index = -1;

  function show(nextIndex, writeHistory = false) {
    nextIndex = (nextIndex + scenes.length) % scenes.length;
    if (nextIndex === index) return;
    index = nextIndex;
    const scene = scenes[index];
    const url = new URL(
      `${main.dataset.base}scenes/${scene.id}/index.html`,
      location.origin,
    );
    const query = new URLSearchParams(location.search);
    for (const key of ['t', 'from', 'grey', 'dither', 'scale']) {
      if (query.has(key)) url.searchParams.set(key, query.get(key));
    }
    if (frame.src !== url.href) {
      // A fresh frame has one initial navigation. Reusing frame.src adds child
      // history entries that can consume Back before the gallery's popstate.
      const replacement = frame.cloneNode(false);
      replacement.src = url.href;
      replacement.title = scene.title;
      bindFrameKeys(replacement);
      frame.replaceWith(replacement);
      frame = replacement;
    }
    frame.title = scene.title;
    document.title = `${scene.title} · Dioramas`;
    announcement.textContent = `${scene.title}, ${index + 1} of ${scenes.length}`;
    if (writeHistory) {
      const address = new URL(location.href);
      address.searchParams.set('scene', scene.id);
      history.pushState(null, '', address);
    }
  }
  function fromAddress() {
    const id = new URLSearchParams(location.search).get('scene');
    show(
      Math.max(
        0,
        scenes.findIndex((scene) => scene.id === id),
      ),
    );
  }
  function move(direction) {
    if (scenes.length > 1) show(index + direction, true);
  }
  function onKey(event) {
    if (
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.target.closest?.('input, textarea, select, [contenteditable]')
    )
      return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      move(event.key === 'ArrowLeft' ? -1 : 1);
    }
  }
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  document.addEventListener('keydown', onKey);
  // Same-origin scenes keep keyboard navigation even after the canvas is clicked.
  function bindFrameKeys(target) {
    target.addEventListener('load', () =>
      target.contentDocument?.addEventListener('keydown', onKey),
    );
  }
  bindFrameKeys(frame);
  window.addEventListener('popstate', fromAddress);
  fromAddress();
}
