(function () {
  const menuItems = [
    {
      type: 'section',
      label: 'Vidiotbox'
    },
    { href: 'index.html', label: 'Vidiotbox-website' },
    { href: 'pictograms.html', label: 'Pictograms' },
    { href: 'vidiotbox-hardware_docs.html', label: 'Vidiotbox-hardware Docs' },
    { href: 'lilygo-t-display-c5.html', label: 'POCKET PROWLER WIFI/BLE ANALYZER' },
    { href: 'docs/pocketprowler-instruction-manual.html', label: 'POCKET PROWLER MANUAL' },
    {
      type: 'section',
      label: 'Paul Hodara'
    },
    { href: 'https://www.instagram.com/phodara', label: 'Follow me on Instagram', external: true },
    { href: 'https://www.paulhodara.com', label: 'My Photography', external: true },
    { href: 'https://www.linkedin.com/in/paulhodara/', label: 'Connect with me on LinkedIn', external: true },
    { href: 'https://github.com/phodara', label: 'My stuff on GitHub', external: true },
    { href: 'https://www.thelivingmuseum.org', label: 'The Living Museum', external: true },
    { href: 'businesscard.html', label: 'My Business Card' }
  ];

  function injectMenuStyles() {
    if (document.getElementById('shared-menu-project-styles')) return;

    const style = document.createElement('style');
    style.id = 'shared-menu-project-styles';
    style.textContent = `
      .menu-panel {
        width: min(260px, calc(100vw - 28px));
        max-height: calc(100vh - 82px);
        overflow-y: auto;
      }
      .menu-section {
        margin: 4px 2px 0;
        color: #b7bbc6;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 1.4px;
        text-transform: uppercase;
      }
    `;
    document.head.appendChild(style);
  }

  function applyExternalAttrs(link) {
    link.target = '_blank';
    link.rel = 'noopener';
  }

  function createMenu() {
    const siteMenu = document.createElement('nav');
    siteMenu.className = 'site-menu';
    siteMenu.dataset.open = 'false';
    siteMenu.setAttribute('aria-label', 'Site navigation');

    const menuToggle = document.createElement('button');
    menuToggle.className = 'menu-toggle';
    menuToggle.type = 'button';
    menuToggle.setAttribute('aria-label', 'Open menu');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.appendChild(document.createElement('span'));

    const menuPanel = document.createElement('div');
    menuPanel.className = 'menu-panel';

    menuItems.forEach(function (item) {
      if (item.type === 'section') {
        const heading = document.createElement('div');
        heading.className = 'menu-section';
        heading.textContent = item.label;
        menuPanel.appendChild(heading);
        return;
      }

      const link = document.createElement('a');
      link.href = item.href;
      link.textContent = item.label;
      if (item.external) {
        applyExternalAttrs(link);
      }
      menuPanel.appendChild(link);
    });

    siteMenu.appendChild(menuToggle);
    siteMenu.appendChild(menuPanel);
    return { siteMenu, menuToggle };
  }

  function mountMenu() {
    injectMenuStyles();

    const currentScript = document.currentScript;
    const menu = createMenu();
    const siteMenu = menu.siteMenu;
    const menuToggle = menu.menuToggle;

    function setMenuOpen(isOpen) {
      siteMenu.dataset.open = String(isOpen);
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      menuToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    }

    menuToggle.addEventListener('click', function () {
      setMenuOpen(siteMenu.dataset.open !== 'true');
    });

    document.addEventListener('click', function (event) {
      if (!siteMenu.contains(event.target)) setMenuOpen(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') setMenuOpen(false);
    });

    siteMenu.querySelectorAll('.menu-panel a').forEach(function (link) {
      link.addEventListener('click', function () {
        setMenuOpen(false);
      });
    });

    if (currentScript && currentScript.parentNode) {
      currentScript.parentNode.insertBefore(siteMenu, currentScript);
    } else {
      document.body.insertBefore(siteMenu, document.body.firstChild);
    }
  }

  mountMenu();
}());
