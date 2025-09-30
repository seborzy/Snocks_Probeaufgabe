(function () {
  const BADGE_CLASS = 'giftwrap-badge';

  function injectStyles() {
    if (document.getElementById('giftwrap-styles')) return;

    const style = document.createElement('style');
    style.id = 'giftwrap-styles';
    style.textContent = `
      .CartItem .CartItem__Info {
        position: relative;
      }

      .${BADGE_CLASS} {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        background-color: #eaeaea;
        position: absolute;
        top: 0;
        right: 0;
        font-size: .75rem;
        line-height: normal;
        padding: 5px;
        border-radius: 3px;
      }

      .${BADGE_CLASS}[data-active="true"] {
        background-color: #837b72;
        color: #fff;
      }

      .${BADGE_CLASS} svg {
        width: 18px;
        height: 18px;
        pointer-events: none;
      }

      .${BADGE_CLASS} span {
        font-weight: 500;
      }

      .CartItem__Info:has(.bestseller-badge) .giftwrap-badge {
        margin-bottom: 10px;
      }

      @media screen and (max-width: 641px) {
        .${BADGE_CLASS} {
          padding: 8px;
          top: 25px;
        }
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

        const hookContainer = item.querySelector('.CartItem__Info a');
        if (!hookContainer) return;

        const isGift = lineItem.properties?.gift_wrap === 'true';
        const container = document.createElement('div');
        container.className = `${BADGE_CLASS} Heading`;
        container.dataset.itemKey = itemKey;
        container.dataset.active = isGift;
        container.setAttribute('role', 'button');
        container.setAttribute('aria-label', 'Als Geschenk verpacken');
        container.setAttribute('title', 'Als Geschenk verpacken');

        container.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19.5 7.75H18.1C18.5 7.27 18.75 6.67 18.75 6C18.75 4.48 17.52 3.25 16 3.25C14.32 3.25 12.84 4.14 12 5.46C11.16 4.14 9.68 3.25 8 3.25C6.48 3.25 5.25 4.48 5.25 6C5.25 6.67 5.5 7.27 5.9 7.75H4.5C3.81 7.75 3.25 8.31 3.25 9V11.5C3.25 12.1 3.68 12.58 4.25 12.7V19.5C4.25 20.19 4.81 20.75 5.5 20.75H18.5C19.19 20.75 19.75 20.19 19.75 19.5V12.7C20.32 12.58 20.75 12.1 20.75 11.5V9C20.75 8.31 20.19 7.75 19.5 7.75ZM19.25 11.25H12.75V9.25H19.25V11.25ZM16 4.75C16.69 4.75 17.25 5.31 17.25 6C17.25 6.69 16.69 7.25 16 7.25H12.84C13.18 5.82 14.47 4.75 16 4.75ZM8 4.75C9.53 4.75 10.82 5.82 11.16 7.25H8C7.31 7.25 6.75 6.69 6.75 6C6.75 5.31 7.31 4.75 8 4.75ZM4.75 9.25H11.25V11.25H4.75V9.25ZM5.75 12.75H11.25V19.25H5.75V12.75ZM18.25 19.25H12.75V12.75H18.25V19.25Z" fill="currentColor"/>
          </svg>
        `;

        container.addEventListener('click', () => {
          const newStatus = container.dataset.active !== 'true';

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

            container.setAttribute(
              'title',
              newStatus ? 'Wird als Geschenk verpackt' : 'Als Geschenk verpacken'
            );
            container.setAttribute(
              'aria-label',
              newStatus ? 'Wird als Geschenk verpackt' : 'Als Geschenk verpacken'
            );
          })
          .catch(err => {
            console.error('Fehler beim Geschenkstatus-Update:', err);
          });
        });

        hookContainer.parentNode.insertBefore(container, hookContainer.nextSibling);
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
