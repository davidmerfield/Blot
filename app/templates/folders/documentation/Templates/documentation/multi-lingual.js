document.addEventListener("DOMContentLoaded", renderMultiLingual);

function renderMultiLingual() {
  const STORAGE_KEY = 'preferredCodeLanguage';
  const codeBlocks = document.querySelectorAll("pre code");
  const codeGroups = [];
  let currentGroup = [];

  const getLanguage = (codeElement) => {
    return Array.from(codeElement.classList).find((cls) => cls !== "hljs");
  };

  // Get stored language preference
  const getStoredLanguage = () => {
    return localStorage.getItem(STORAGE_KEY);
  };

  // Save language preference
  const saveLanguagePreference = (lang) => {
    localStorage.setItem(STORAGE_KEY, lang);
  };

  codeBlocks.forEach((block, index) => {
    currentGroup.push(block.parentElement);

    const nextElement = block.parentElement.nextElementSibling;
    if (
      !nextElement?.querySelector("code") ||
      index === codeBlocks.length - 1
    ) {
      if (currentGroup.length >= 1) {
        codeGroups.push([...currentGroup]);
      }
      currentGroup = [];
    }
  });

  codeGroups.forEach((group) => {
    const wrapper = document.createElement("div");
    wrapper.className = "code-group";

    const toolbarContainer = document.createElement("div");
    toolbarContainer.className = "code-toolbar";

    const tabsContainer = document.createElement("div");
    tabsContainer.className = "code-tabs";

    const languages = [
      ...new Set(
        group.map((pre) => getLanguage(pre.firstElementChild)).filter(Boolean)
      ),
    ];

    const storedLanguage = getStoredLanguage();

    if (languages.length === 1) {
      const label = document.createElement("span");
      label.className = "code-tab";
      label.textContent = languages[0];
      tabsContainer.appendChild(label);
    } else if (languages.length > 1) {
      languages.forEach((lang, i) => {
        const tab = document.createElement("button");
        const isStoredLang = lang === storedLanguage;
        const isFirstTab = i === 0;
        tab.className = `code-tab ${(isStoredLang || (!storedLanguage && isFirstTab)) ? "active" : ""}`;
        tab.textContent = lang;
        tab.setAttribute("data-lang", lang);
        tabsContainer.appendChild(tab);
      });
    }

    const copyButton = document.createElement("button");
    copyButton.className = "copy-button";
    copyButton.innerHTML = `
            <span class="copy-icon">📋</span>
            <span class="copy-text">Copy</span>
          `;

    copyButton.addEventListener("click", () => {
      const activeBlock = wrapper.querySelector(
        ".code-block-wrapper.active code"
      );
      const textToCopy = activeBlock.textContent;

      navigator.clipboard
        .writeText(textToCopy)
        .then(() => {
          copyButton.querySelector(".copy-text").textContent = "Copied!";
          setTimeout(() => {
            copyButton.querySelector(".copy-text").textContent = "Copy";
          }, 2000);
        })
        .catch((err) => {
          console.error("Failed to copy:", err);
        });
    });

    toolbarContainer.appendChild(tabsContainer);
    toolbarContainer.appendChild(copyButton);

    group.forEach((pre, i) => {
      const lang = getLanguage(pre.firstElementChild);
      const blockWrapper = document.createElement("div");
      const isStoredLang = lang === storedLanguage;
      const isFirstBlock = i === 0;
      blockWrapper.className = `code-block-wrapper ${(isStoredLang || (!storedLanguage && isFirstBlock)) ? "active" : ""}`;
      if (lang) {
        blockWrapper.setAttribute("data-lang", lang);
      }

      pre.parentNode.insertBefore(wrapper, pre);
      blockWrapper.appendChild(pre);
      wrapper.appendChild(blockWrapper);
    });

    wrapper.insertBefore(toolbarContainer, wrapper.firstChild);

    if (languages.length > 1) {
      tabsContainer.addEventListener("click", (e) => {
        if (e.target.classList.contains("code-tab")) {
          const lang = e.target.getAttribute("data-lang");
          
          // Save the selected language
          saveLanguagePreference(lang);

          const allTabs = tabsContainer.querySelectorAll(".code-tab");
          const allBlocks = wrapper.querySelectorAll(".code-block-wrapper");

          allTabs.forEach((tab) => {
            tab.classList.toggle("active", tab === e.target);
          });

          allBlocks.forEach((block) => {
            block.classList.toggle(
              "active",
              block.getAttribute("data-lang") === lang
            );
          });

          // Sync all other code groups
          document.querySelectorAll(".code-group").forEach((otherGroup) => {
            if (otherGroup !== wrapper) {
              const matchingTab = otherGroup.querySelector(
                `.code-tab[data-lang="${lang}"]`
              );
              if (matchingTab && !matchingTab.classList.contains("active")) {
                matchingTab.click();
              }
            }
          });
        }
      });
    }
  });

  // Initialize stored language on page load
  const storedLang = getStoredLanguage();
  if (storedLang) {
    const firstGroupTab = document.querySelector(`.code-tab[data-lang="${storedLang}"]`);
    if (firstGroupTab && !firstGroupTab.classList.contains('active')) {
      firstGroupTab.click();
    }
  }
}