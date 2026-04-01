const tagColors = [ "rgba(8,8,8,0.5)", "rgba(204,130,115,0.4)", "rgba(226,170,125,0.4)", "rgba(240,207,142,0.4)", "rgba(246,237,206,0.4)", "rgba(168,200,166,0.4)", "rgba(108,141,138,0.4)", "rgba(100,80,88,0.4)"];
        
const header = document.getElementById("header");
const filter = document.getElementById("filter");
const buttonContent = document.getElementById("buttonContent");
const tagButtons = document.getElementsByClassName("buttonTag");
const items = document.getElementsByClassName("item");

const itemTags = [];
const itemContents = [];
const itemLinks = [];
const itemAnchors = [];
const itemCollapse = [];

let isContent = false;
let isTag = false;
let highlighted = 0;
let currentLanguage = localStorage.getItem('language') || 'en';

document.addEventListener("DOMContentLoaded", (event) => {
    buttonContent.addEventListener("click", () => { toggleAllContent() });

    for (let i = 0; i < tagButtons.length; i++) {
        const index = tagButtons[i].dataset.index
        tagButtons[i].addEventListener("click", () => { filterByTag(index) });
        tagButtons[i].style.backgroundColor = tagColors[i];
    }

    for (let i = 0; i < items.length; i++) {
        const link = items[i].getElementsByClassName("itemLink")[0];
        itemLinks.push(link);
        itemAnchors.push(link.href.split('#')[1]);
        link.addEventListener("click", () => { expandContent(i); highlight(i) });
        const content = items[i].getElementsByClassName("content")[0];
        itemContents.push(content);
        const collapse = items[i].getElementsByClassName("itemCollapse")[0]
        collapse.addEventListener("click", () => { toggleContent(i) });
        itemCollapse.push(collapse);
        const tags = items[i].getElementsByClassName("tag");

        const arr = []
        for (let j = 0; j < tags.length; j++) {
            arr.push(tags[j].dataset.index);

        }
        itemTags.push(arr);
    }
    
    // Language selector
    const currentLangButton = document.getElementById("currentLang");
    const langDropdown = document.getElementById("langDropdown");
    const langOptions = document.getElementsByClassName("langOption");
    
    currentLangButton.addEventListener("click", () => {
        langDropdown.classList.toggle("hidden");
    });
    
    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
        if (!e.target.closest("#languageSelector")) {
            langDropdown.classList.add("hidden");
        }
    });
    
    for (let i = 0; i < langOptions.length; i++) {
        langOptions[i].addEventListener("click", () => {
            const lang = langOptions[i].dataset.lang;
            changeLanguage(lang);
            langDropdown.classList.add("hidden");
        });
    }
    
    // Mobile menu toggle
    const menuToggle = document.getElementById("menuToggle");
    const filterMenu = document.getElementById("filter");
    const menu = document.getElementById("menu");
    
    if (menuToggle) {
        menuToggle.addEventListener("click", () => {
            filterMenu.classList.toggle("open");
            menuToggle.classList.toggle("open");
            menu.classList.toggle("menuExpanded");
        });
    }
    
    readURLAnchor();
    changeLanguage(currentLanguage);
});

function expandContent(index) {
    itemContents[index].classList.remove("hidden");
}

function toggleContent(index) {
    itemContents[index].classList.toggle("hidden");
}

function toggleAllContent() {
    isContent = !isContent;
    if (isContent) {
        for (let i = 0; i < itemContents.length; i++) {
            itemContents[i].classList.add("hidden");
        }
    } else {
        for (let i = 0; i < itemContents.length; i++) {
            itemContents[i].classList.remove("hidden");
        }
    }
    if (header) {
        header.classList.toggle("hidden");
    }
    buttonContent.textContent = isContent ? translations[currentLanguage]['expand'] : translations[currentLanguage]['collapse'];
}

function filterByTag(index) {
    for (let i = 0; i < tagButtons.length; i++) {
        tagButtons[i].classList.remove("active");
    }

    const tagCurrent = parseInt(index);
    if(!tagButtons[tagCurrent]){ console.log("Error! Tag ID does not exist!"); return; }
    tagButtons[tagCurrent].classList.add("active");

    if (index != "0"){
        for (let i = 0; i < itemTags.length; i++) {
            items[i].classList.remove("hidden");
            if (itemTags[i].indexOf(index) == -1) {
                items[i].classList.add("hidden");
            }
        }
    }else{
        for (let i = 0; i < itemTags.length; i++) {
            items[i].classList.remove("hidden");
        }
    }

}

function readURLAnchor() {
    if(document.URL.split('#').length > 1){
        let anchor = document.URL.split('#')[1];
        console.log(anchor);

        for(let i=0; i<itemAnchors.length; i++){
            if(itemAnchors[i] == anchor){
                highlight(i);
                return;
            }
        }
    };
}

function highlight(index){
    itemLinks[highlighted].classList.remove("highlight");
    itemLinks[index].classList.add("highlight");
    highlighted = index;
}

function changeLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    
    // Update flag icon
    const currentFlag = document.getElementById("currentFlag");
    currentFlag.src = lang === 'en' ? 'img/EN.png' : 'img/FR.png';
    currentFlag.alt = lang.toUpperCase();
    
    // Update HTML lang attribute
    document.documentElement.lang = lang;
    
    // Translate all elements with data-i18n attribute
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });
    
    // Translate all shortcut titles (h3:first-child in items)
    const itemElements = document.querySelectorAll('.item');
    itemElements.forEach(item => {
        const titleElement = item.querySelector('.itemLink h3:first-child');
        if (titleElement) {
            // Store original English text if not already stored
            if (!titleElement.dataset.originalText) {
                titleElement.dataset.originalText = titleElement.textContent.trim();
            }
            const originalText = titleElement.dataset.originalText;
            if (translations[lang] && translations[lang][originalText]) {
                titleElement.textContent = translations[lang][originalText];
            }
        }
    });
    
    // Translate keywords in content (important tags)
    const importantElements = document.querySelectorAll('.important');
    importantElements.forEach(elem => {
        if (!elem.dataset.originalText) {
            elem.dataset.originalText = elem.textContent.trim();
        }
        const originalText = elem.dataset.originalText;
        if (translations[lang] && translations[lang][originalText]) {
            elem.textContent = translations[lang][originalText];
        }
    });
    
    // Translate keyboard shortcuts
    const shortcutElements = document.querySelectorAll('.shortcut');
    shortcutElements.forEach(elem => {
        if (!elem.dataset.originalText) {
            elem.dataset.originalText = elem.textContent.trim();
        }
        const originalText = elem.dataset.originalText;
        if (translations[lang] && translations[lang][originalText]) {
            elem.textContent = translations[lang][originalText];
        }
    });
    
    // Translate content paragraphs
    itemElements.forEach(item => {
        const itemId = item.id;
        const contentKey = contentIdMapping[itemId];
        
        if (contentKey && contentTranslations[lang] && contentTranslations[lang][contentKey]) {
            const contentDiv = item.querySelector('.content ul');
            if (contentDiv) {
                const listItems = contentDiv.querySelectorAll('li');
                const translations = contentTranslations[lang][contentKey];
                
                listItems.forEach((li, index) => {
                    if (translations[index]) {
                        const p = li.querySelector('p');
                        if (p) {
                            p.innerHTML = translations[index];
                        }
                    }
                });
            }
        }
    });
    
    // Update button content text if needed
    if (buttonContent) {
        buttonContent.textContent = isContent ? translations[lang]['expand'] : translations[lang]['collapse'];
    }
}
