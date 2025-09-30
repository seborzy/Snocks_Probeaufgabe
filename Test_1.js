(function () {
  const BADGE_CLASS = 'giftwrap-badge';

  function injectStyles() {
    if (document.getElementById('giftwrap-styles')) return;

    const style = document.createElement('style');
    style.id = 'giftwrap-styles';
    style.textContent = `
      .${BADGE_CLASS} {
        vertical-align: middle;
        color: #000;
        font-size: .75rem;
        line-height: normal;
        width: fit-content;
        cursor: pointer;
        display: inline-flex;
        gap: 6px;
        align-items: center;
      }

      .${BADGE_CLASS} span {
        padding-top: 2px;
      }

      .${BADGE_CLASS}[data-active="true"] {
        accent-color: #837b72;
      }

      .${BADGE_CLASS} input[type="checkbox"] {
        width: 14px;
        height: 14px;
        accent-color: #837b72;
        cursor: pointer;
        margin: 0;
      }

      .CartItem__Info:has(.bestseller-badge) .giftwrap-badge {
        margin-bottom: 10px;
      }

    `;
    document.head.appendChild(style);
  }

  async function init() {
    try {
      const cart = await fetch('/cart.js').then(res => res.json());
      const itemMap = new Map(cart.items.map(item => [item.key, item]));

      document.querySelectorAll('.CartItem').forEach(item => {

        if (item.querySelector(`.${BADGE_CLASS}`)) return;

        const input = item.querySelector('input[name^="updates["]');
        const itemKey = input?.name?.match(/updates\[(.*?)\]/)?.[1];
        if (!itemKey) return;

        const lineItem = itemMap.get(itemKey);
        if (!lineItem) return;

        const metaContainer = item.querySelector('.CartItem__Meta');
        if (!metaContainer) return;

        const isGift = lineItem.properties?.gift_wrap === 'true';
        const container = document.createElement('label');
        container.className = `${BADGE_CLASS} Heading`;
        container.dataset.itemKey = itemKey;
        container.dataset.active = isGift;

        container.innerHTML = `
          <input type="checkbox" ${isGift ? 'checked' : ''}>
          <span>Als Geschenk verpacken</span>
        `;

        const checkbox = container.querySelector('input[type="checkbox"]');

        checkbox.addEventListener('change', () => {
          const newStatus = checkbox.checked;

          fetch('/cart/change.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: itemKey,
              quantity: lineItem.quantity,
              properties: {
                ...lineItem.properties,
                gift_wrap: newStatus ? 'true' : 'false'
              }
            })
          })
          .then(res => res.json())
          .then(() => {
            container.dataset.active = newStatus;
          })
          .catch(err => {
            console.error('Fehler beim Geschenkstatus-Update:', err);
          });
        });

        metaContainer.parentNode.insertBefore(container, metaContainer.nextSibling);
      });
    } catch (err) {
      console.error('Fehler beim Initialisieren:', err);
    }
  }

  injectStyles();

  const observer = new MutationObserver(() => {
    if (document.querySelector('#sidebar-cart')) init();
  });

  observer.observe(document.body, { childList: true, subtree: true });
  observer.disconnect();

  init();

})();
