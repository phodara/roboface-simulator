(function () {
  const menuItems = [
    {
      type: 'section',
      label: 'Vidiotbox'
    },
    { href: 'index.html', label: 'Vidiotbox-website' },
    { href: 'pictograms.html', label: 'Pictograms' },
    { href: 'vidiotbox-hardware_docs.html', label: 'Vidiotbox-hardware Docs' },
    {
      type: 'section',
      label: 'LilyGO Project'
    },
    {
      type: 'project',
      title: 'LilyGO T-Display C5 WiFi/BLE Analyzer',
      eyebrow: 'UniGeek firmware',
      image: 'https://lilygo.cc/cdn/shop/files/LILYGO-T-DISPLAY-C5_7.jpg?v=1783057404&width=600',
      description: 'One firmware for ESP32 boards with WiFi, BLE, NFC, IR, Sub-GHz, USB HID, web flashing, and on-device tools for research and education.',
      links: [
        { href: 'https://github.com/lshaf/unigeek/releases/latest', label: 'Latest release', external: true },
        { href: 'https://unigeek.xid.run/', label: 'Project site', external: true }
      ]
    },
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
        width: min(340px, calc(100vw - 28px));
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
      .menu-project {
        display: grid;
        gap: 10px;
        padding: 10px;
        border: 1px solid #2a6f78;
        background: #071315;
      }
      .menu-project img {
        display: block;
        width: 100%;
        aspect-ratio: 16 / 10;
        object-fit: cover;
        background: #fff;
      }
      .menu-project-kicker {
        margin: 0 0 3px;
        color: #b7bbc6;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 1.2px;
        text-transform: uppercase;
      }
      .menu-project-title {
        margin: 0;
        color: #7dd3fc;
        font-size: 13px;
        line-height: 1.25;
        font-weight: 900;
        letter-spacing: .5px;
        text-transform: uppercase;
      }
      .menu-project-description {
        margin: 6px 0 0;
        color: #d7dee3;
        font-size: 12px;
        line-height: 1.45;
        font-weight: 600;
        letter-spacing: 0;
      }
      .menu-project-links {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      .menu-panel .menu-project-link {
        padding: 9px 8px;
        text-align: center;
        font-size: 11px;
      }
    `;
    document.head.appendChild(style);
  }

  function applyExternalAttrs(link) {
    link.target = '_blank';
    link.rel = 'noopener';
  }

  function createProjectCard(item) {
    const card = document.createElement('div');
    card.className = 'menu-project';

    const image = document.createElement('img');
    image.src = item.image;
    image.alt = item.title;
    image.loading = 'lazy';
    card.appendChild(image);

    const copy = document.createElement('div');

    const eyebrow = document.createElement('p');
    eyebrow.className = 'menu-project-kicker';
    eyebrow.textContent = item.eyebrow;
    copy.appendChild(eyebrow);

    const title = document.createElement('h2');
    title.className = 'menu-project-title';
    title.textContent = item.title;
    copy.appendChild(title);

    const description = document.createElement('p');
    description.className = 'menu-project-description';
    description.textContent = item.description;
    copy.appendChild(description);

    card.appendChild(copy);

    const links = document.createElement('div');
    links.className = 'menu-project-links';
    item.links.forEach(function (projectLink) {
      const link = document.createElement('a');
      link.className = 'menu-project-link';
      link.href = projectLink.href;
      link.textContent = projectLink.label;
      if (projectLink.external) applyExternalAttrs(link);
      links.appendChild(link);
    });
    card.appendChild(links);

    return card;
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

      if (item.type === 'project') {
        menuPanel.appendChild(createProjectCard(item));
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
