(function () {
  const body = document.body;
  const toastElement = document.querySelector(".toast");

  const STATIC_SITE_META = {
    server: {
      name: "Название сервера",
      ip: "play.example.ru"
    },
    support: {
      label: "Поддержать сервер",
      url: "#support-block"
    }
  };

  const DATA_FILES = {
    banners: "data/banners.json",
    news: "data/news.json",
    creators: "data/creators.json",
    mods: "data/mods.json",
    events: "data/events.json",
    rules: "data/rules.json",
    constitution: "data/constitution.json"
  };

  const ADMIN_ACCESS_HASH = "NDg1MmpzY3c3Mg==";

  const showToast = (message) => {
    if (!toastElement) return;

    toastElement.textContent = message;
    toastElement.classList.add("is-visible");
    clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      toastElement.classList.remove("is-visible");
    }, 2600);
  };

  const formatDate = (value) => {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(date);
  };

  const safeText = (value, fallback = "") => String(value || fallback);

  const applyServerMeta = () => {
    const serverName = STATIC_SITE_META.server.name.trim();
    const serverIp = STATIC_SITE_META.server.ip.trim();

    document.querySelectorAll("[data-server-name]").forEach((node) => {
      node.textContent = serverName;
    });

    if (document.title.includes("Minecraft Server")) {
      document.title = document.title.replace("Minecraft Server", serverName);
    }

    const ipNode = document.querySelector("[data-server-ip]");
    const copyButton = document.querySelector("[data-copy-button]");

    if (ipNode && copyButton) {
      ipNode.textContent = serverIp;
      copyButton.dataset.copyValue = serverIp;
    }
  };

  const applySupportMeta = () => {
    const supportUrl = STATIC_SITE_META.support.url.trim();
    const supportLabel = STATIC_SITE_META.support.label.trim() || "Поддержать сервер";

    document.querySelectorAll("[data-support-link]").forEach((link) => {
      link.textContent = supportLabel;
      link.setAttribute("href", supportUrl || "#");

      if (/^https?:\/\//i.test(supportUrl)) {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
      }
    });
  };

  const setupCopyButton = () => {
    const copyButton = document.querySelector("[data-copy-button]");
    if (!copyButton) return;

    copyButton.addEventListener("click", async () => {
      const value = copyButton.dataset.copyValue?.trim();

      if (!value) {
        showToast("Сначала укажите IP сервера.");
        return;
      }

      try {
        await navigator.clipboard.writeText(value);
        showToast("IP сервера скопирован.");
      } catch (error) {
        showToast("Не удалось скопировать IP.");
      }
    });
  };

  const setupMobileNavigation = () => {
    document.querySelectorAll(".nav-toggle").forEach((button) => {
      const navId = button.getAttribute("aria-controls");
      const nav = navId ? document.getElementById(navId) : null;
      if (!nav) return;

      button.addEventListener("click", () => {
        const expanded = button.getAttribute("aria-expanded") === "true";
        button.setAttribute("aria-expanded", String(!expanded));
        nav.classList.toggle("is-open", !expanded);
      });

      nav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
          button.setAttribute("aria-expanded", "false");
          nav.classList.remove("is-open");
        });
      });
    });
  };

  const setupRevealAnimation = () => {
    const items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries, instance) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        instance.unobserve(entry.target);
      });
    }, {
      threshold: 0.18
    });

    items.forEach((item) => observer.observe(item));
  };

  const renderCards = ({ list, containerSelector, templateSelector, mapItem }) => {
    const container = document.querySelector(containerSelector);
    const template = document.querySelector(templateSelector);

    if (!container || !template || !Array.isArray(list) || !list.length) return;

    container.innerHTML = "";

    list.forEach((item) => {
      const fragment = template.content.cloneNode(true);
      mapItem(fragment, item);
      container.appendChild(fragment);
    });
  };

  const fetchJson = async (path) => {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Не удалось загрузить ${path}`);
    }
    return response.json();
  };

  const loadDataBundle = async (keys) => {
    const uniqueKeys = [...new Set(keys)].filter((key) => DATA_FILES[key]);
    const entries = await Promise.all(uniqueKeys.map(async (key) => [key, await fetchJson(DATA_FILES[key])]));
    return Object.fromEntries(entries);
  };

  const renderHomePage = (data) => {
    renderCards({
      list: data.banners,
      containerSelector: "[data-banner-list]",
      templateSelector: "#banner-card-template",
      mapItem: (fragment, item) => {
        const link = fragment.querySelector(".banner-link");
        const image = fragment.querySelector(".banner-image");
        const title = fragment.querySelector(".banner-copy h3");
        const text = fragment.querySelector(".banner-copy p");

        link.href = safeText(item.link, "#");
        image.src = safeText(item.image);
        image.alt = safeText(item.title, "Баннер");
        title.textContent = safeText(item.title, "Без названия");
        text.textContent = safeText(item.text);
      }
    });
  };

  const renderNewsPage = (data) => {
    renderCards({
      list: data.news,
      containerSelector: "[data-news-list]",
      templateSelector: "#news-card-template",
      mapItem: (fragment, item) => {
        const image = fragment.querySelector(".news-image");
        const time = fragment.querySelector("time");
        const title = fragment.querySelector("h3");
        const text = fragment.querySelector("p");

        image.src = safeText(item.image);
        image.alt = safeText(item.title, "Новость");
        time.textContent = formatDate(item.date) || "Дата не указана";
        time.dateTime = safeText(item.date);
        title.textContent = safeText(item.title, "Без названия");
        text.textContent = safeText(item.text);
      }
    });
  };

  const renderEventsPage = (data) => {
    renderCards({
      list: data.events,
      containerSelector: "[data-events-list]",
      templateSelector: "#event-card-template",
      mapItem: (fragment, item) => {
        const time = fragment.querySelector("time");
        const title = fragment.querySelector("h3");
        const text = fragment.querySelector("p");

        time.textContent = formatDate(item.date) || "Дата не указана";
        time.dateTime = safeText(item.date);
        title.textContent = safeText(item.title, "Без названия");
        text.textContent = safeText(item.text);
      }
    });
  };

  const renderCreatorsPage = (data) => {
    renderCards({
      list: data.creators,
      containerSelector: "[data-creators-list]",
      templateSelector: "#creator-card-template",
      mapItem: (fragment, item) => {
        const image = fragment.querySelector(".creator-avatar");
        const title = fragment.querySelector("h3");
        const text = fragment.querySelector("p");
        const link = fragment.querySelector(".creator-link");

        image.src = safeText(item.avatar || item.image);
        image.alt = safeText(item.name, "Автор");
        title.textContent = safeText(item.name, "Без имени");
        text.textContent = safeText(item.description || item.text);
        link.href = safeText(item.link, "#");
      }
    });
  };

  const renderModsPage = (data) => {
    renderCards({
      list: data.mods,
      containerSelector: "[data-mods-list]",
      templateSelector: "#mod-card-template",
      mapItem: (fragment, item) => {
        const image = fragment.querySelector(".mod-image");
        const title = fragment.querySelector("h3");
        const text = fragment.querySelector("p");
        const link = fragment.querySelector(".download-button");

        image.src = safeText(item.image);
        image.alt = safeText(item.name, "Мод");
        title.textContent = safeText(item.name, "Без названия");
        text.textContent = safeText(item.description);
        link.href = safeText(item.download, "#");
      }
    });
  };

  const renderRulesPage = (data) => {
    renderCards({
      list: data.rules,
      containerSelector: "[data-rules-list]",
      templateSelector: "#rule-card-template",
      mapItem: (fragment, item) => {
        const chip = fragment.querySelector(".meta-chip");
        const title = fragment.querySelector("h2");
        const list = fragment.querySelector(".rule-list");
        const entries = Array.isArray(item.items) ? item.items : [];

        chip.textContent = safeText(item.category, "Категория");
        title.textContent = safeText(item.title, "Без названия");
        list.innerHTML = "";

        entries.forEach((entry) => {
          const li = document.createElement("li");
          li.textContent = entry;
          list.appendChild(li);
        });
      }
    });
  };

  const renderConstitutionPage = (data) => {
    const payload = data.constitution || {};
    const nav = document.querySelector("[data-constitution-nav]");
    const content = document.querySelector("[data-constitution-content]");
    const template = document.querySelector("#constitution-article-template");
    const lead = document.querySelector("[data-constitution-note]");
    const heroTitle = document.querySelector("[data-constitution-title]");
    const heroText = document.querySelector("[data-constitution-description]");
    const articles = Array.isArray(payload.articles) ? payload.articles : [];

    if (heroTitle && payload.title) heroTitle.textContent = payload.title;
    if (heroText && payload.description) heroText.textContent = payload.description;
    if (lead) lead.textContent = safeText(payload.note, "Используйте эту страницу как основу для официального документа сервера.");

    if (!nav || !content || !template || !articles.length) return;

    nav.innerHTML = "";
    content.innerHTML = "";

    articles.forEach((article, index) => {
      const articleId = safeText(article.id, `article-${index + 1}`);
      const navLink = document.createElement("a");
      navLink.href = `#${articleId}`;
      navLink.textContent = safeText(article.label, `Статья ${index + 1}`);
      nav.appendChild(navLink);

      const fragment = template.content.cloneNode(true);
      const articleNode = fragment.querySelector(".document-article");
      const label = fragment.querySelector(".article-label");
      const title = fragment.querySelector("h2");
      const sectionsHost = fragment.querySelector("[data-article-sections]");

      articleNode.id = articleId;
      label.textContent = safeText(article.label, `Статья ${index + 1}`);
      title.textContent = safeText(article.title, "Без названия");
      sectionsHost.innerHTML = "";

      (Array.isArray(article.sections) ? article.sections : []).forEach((section) => {
        const sectionNode = document.createElement("section");
        sectionNode.className = "article-section";

        const sectionTitle = document.createElement("h3");
        sectionTitle.textContent = safeText(section.title, "Раздел");

        const sectionText = document.createElement("p");
        sectionText.textContent = safeText(section.text);

        sectionNode.append(sectionTitle, sectionText);
        sectionsHost.appendChild(sectionNode);
      });

      content.appendChild(fragment);
    });
  };

  const renderAdminPreview = (type, data, container) => {
    if (!container) return;

    if (type === "constitution") {
      const articles = Array.isArray(data.articles) ? data.articles : [];
      container.innerHTML = articles.map((article) => {
        const sections = Array.isArray(article.sections) ? article.sections : [];
        return `
          <article class="glass-card document-article">
            <p class="article-label">${safeText(article.label, "Статья")}</p>
            <h2>${safeText(article.title, "Без названия")}</h2>
            ${sections.map((section) => `
              <section class="article-section">
                <h3>${safeText(section.title, "Раздел")}</h3>
                <p>${safeText(section.text)}</p>
              </section>
            `).join("")}
          </article>
        `;
      }).join("");
      return;
    }

    const list = Array.isArray(data) ? data : [];
    container.innerHTML = "";

    if (!list.length) {
      container.innerHTML = `
        <article class="glass-card empty-card">
          <span class="empty-badge">Пусто</span>
          <h3>JSON пока пустой</h3>
          <p>Добавьте объекты в массив и предпросмотр появится сразу.</p>
        </article>
      `;
      return;
    }

    list.forEach((item) => {
      let html = "";

      if (type === "news") {
        html = `
          <article class="glass-card news-card">
            <div class="news-image-wrap">
              <img class="news-image" src="${safeText(item.image)}" alt="${safeText(item.title, "Новость")}">
            </div>
            <div class="news-content">
              <div class="card-meta">
                <span class="meta-chip">Новость</span>
                <time datetime="${safeText(item.date)}">${formatDate(item.date) || "Дата не указана"}</time>
              </div>
              <h3>${safeText(item.title, "Без названия")}</h3>
              <p>${safeText(item.text)}</p>
            </div>
          </article>
        `;
      }

      if (type === "banners") {
        html = `
          <article class="glass-card banner-card">
            <a class="banner-link" href="${safeText(item.link, "#")}" target="_blank" rel="noopener noreferrer">
              <div class="banner-image-wrap">
                <img class="banner-image" src="${safeText(item.image)}" alt="${safeText(item.title, "Баннер")}">
              </div>
              <div class="banner-copy">
                <h3>${safeText(item.title, "Без названия")}</h3>
                <p>${safeText(item.text)}</p>
                <span class="banner-more">Открыть</span>
              </div>
            </a>
          </article>
        `;
      }

      if (type === "events") {
        html = `
          <article class="glass-card event-card">
            <div class="card-meta">
              <span class="meta-chip">Ивент</span>
              <time datetime="${safeText(item.date)}">${formatDate(item.date) || "Дата не указана"}</time>
            </div>
            <h3>${safeText(item.title, "Без названия")}</h3>
            <p>${safeText(item.text)}</p>
          </article>
        `;
      }

      if (type === "creators") {
        html = `
          <article class="glass-card creator-card">
            <div class="creator-avatar-wrap">
              <img class="creator-avatar" src="${safeText(item.avatar || item.image)}" alt="${safeText(item.name, "Автор")}">
            </div>
            <div class="creator-content">
              <h3>${safeText(item.name, "Без имени")}</h3>
              <p>${safeText(item.description)}</p>
              <a class="button button-secondary creator-link" href="${safeText(item.link, "#")}" target="_blank" rel="noopener noreferrer">Открыть</a>
            </div>
          </article>
        `;
      }

      if (type === "mods") {
        html = `
          <article class="glass-card mod-card">
            <div class="mod-image-wrap">
              <img class="mod-image" src="${safeText(item.image)}" alt="${safeText(item.name, "Мод")}">
            </div>
            <div class="mod-content">
              <h3>${safeText(item.name, "Без названия")}</h3>
              <p>${safeText(item.description)}</p>
              <a class="button button-primary download-button" href="${safeText(item.download, "#")}" target="_blank" rel="noopener noreferrer">Скачать</a>
            </div>
          </article>
        `;
      }

      if (type === "rules") {
        const items = Array.isArray(item.items) ? item.items : [];
        html = `
          <article class="glass-card rule-group">
            <div class="card-meta">
              <span class="meta-chip">${safeText(item.category, "Категория")}</span>
            </div>
            <h2>${safeText(item.title, "Без названия")}</h2>
            <ul class="rule-list">
              ${items.map((entry) => `<li>${safeText(entry)}</li>`).join("")}
            </ul>
          </article>
        `;
      }

      container.insertAdjacentHTML("beforeend", html);
    });
  };

  const setupAdminPanel = async () => {
    if (body.dataset.page !== "admin") return;

    const lockPanel = document.querySelector("[data-admin-lock]");
    const workspace = document.querySelector("[data-admin-workspace]");
    const accessForm = document.querySelector("[data-admin-access-form]");
    const accessInput = document.querySelector("[data-admin-access-input]");
    const encodedTarget = window.atob(ADMIN_ACCESS_HASH);

    if (lockPanel && workspace) {
      workspace.classList.add("is-hidden");
    }

    accessForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      const value = accessInput?.value.trim();

      if (value !== encodedTarget) {
        showToast("Неверный код доступа.");
        return;
      }

      lockPanel?.classList.add("is-hidden");
      workspace?.classList.remove("is-hidden");
      showToast("Админ-панель разблокирована.");
    });

    const editorSections = document.querySelectorAll("[data-json-editor-section]");
    if (!editorSections.length) return;

    const bundle = await loadDataBundle(["news", "banners", "creators", "mods", "events", "rules", "constitution"]);

    editorSections.forEach((section) => {
      const key = section.dataset.jsonEditorSection;
      const textarea = section.querySelector("[data-json-editor]");
      const status = section.querySelector("[data-json-status]");
      const preview = section.querySelector("[data-admin-preview]");
      const copyButton = section.querySelector("[data-copy-json]");
      const downloadButton = section.querySelector("[data-download-json]");
      const resetButton = section.querySelector("[data-reset-json]");
      const initialValue = JSON.stringify(bundle[key], null, 2);

      if (!textarea) return;

      textarea.value = initialValue;

      const syncPreview = () => {
        try {
          const parsed = JSON.parse(textarea.value);
          status.textContent = "JSON валиден";
          status.classList.remove("is-error");
          renderAdminPreview(key, parsed, preview);
          return parsed;
        } catch (error) {
          status.textContent = "Ошибка JSON";
          status.classList.add("is-error");
          preview.innerHTML = `
            <article class="glass-card empty-card">
              <span class="empty-badge">Ошибка</span>
              <h3>Проверьте синтаксис JSON</h3>
              <p>${safeText(error.message)}</p>
            </article>
          `;
          return null;
        }
      };

      textarea.addEventListener("input", syncPreview);

      copyButton?.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(textarea.value);
          showToast(`JSON из ${key} скопирован.`);
        } catch (error) {
          showToast("Не удалось скопировать JSON.");
        }
      });

      downloadButton?.addEventListener("click", () => {
        const filePath = DATA_FILES[key] || `${key}.json`;
        const fileName = filePath.split("/").pop();
        const blob = new Blob([textarea.value], { type: "application/json;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = fileName;
        link.click();

        URL.revokeObjectURL(url);
        showToast(`Файл ${fileName} подготовлен к скачиванию.`);
      });

      resetButton?.addEventListener("click", () => {
        textarea.value = initialValue;
        syncPreview();
        showToast(`JSON ${key} восстановлен из файла.`);
      });

      syncPreview();
    });
  };

  const initPageData = async () => {
    const page = body.dataset.page;

    try {
      if (page === "home") {
        renderHomePage(await loadDataBundle(["banners"]));
      }

      if (page === "news") {
        renderNewsPage(await loadDataBundle(["news"]));
      }

      if (page === "events") {
        renderEventsPage(await loadDataBundle(["events"]));
      }

      if (page === "creators") {
        renderCreatorsPage(await loadDataBundle(["creators"]));
      }

      if (page === "mods") {
        renderModsPage(await loadDataBundle(["mods"]));
      }

      if (page === "rules") {
        renderRulesPage(await loadDataBundle(["rules"]));
      }

      if (page === "constitution") {
        renderConstitutionPage(await loadDataBundle(["constitution"]));
      }

      if (page === "admin") {
        await setupAdminPanel();
      }
    } catch (error) {
      showToast("Не удалось загрузить JSON. Проверьте папку data.");
      console.error(error);
    }
  };

  applyServerMeta();
  applySupportMeta();
  setupCopyButton();
  setupMobileNavigation();
  setupRevealAnimation();
  initPageData().finally(() => {
    setupRevealAnimation();
  });
})();
