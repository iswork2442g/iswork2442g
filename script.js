// 語言切換函數
function toggleLanguage(lang) {
    const html = document.documentElement;
    const currentLang = html.getAttribute('data-lang');
    const newLang = lang || (currentLang === 'zh' ? 'en' : currentLang === 'en' ? 'ja' : 'zh');
    
    // 更新語言屬性
    html.setAttribute('data-lang', newLang);
    html.setAttribute('lang', newLang);
    
    // 保存語言偏好
    localStorage.setItem('preferredLanguage', newLang);
    
    // 更新按鈕狀態
    const langBtns = document.querySelectorAll('.lang-btn');
    langBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-lang') === newLang) {
            btn.classList.add('active');
        }
    });
}

// 頁面加載時初始化
document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('preferredLanguage') || 'zh';
    const html = document.documentElement;
    html.setAttribute('data-lang', savedLang);
    html.setAttribute('lang', savedLang);
    
    // 設置初始按鈕狀態
    const langBtns = document.querySelectorAll('.lang-btn');
    langBtns.forEach(btn => {
        if (btn.getAttribute('data-lang') === savedLang) {
            btn.classList.add('active');
        }
    });
    
    // 添加按鈕點擊事件（備用方案）
    const langToggle = document.querySelector('.lang-toggle');
    langToggle?.addEventListener('click', () => toggleLanguage());
});

// 確保函數在全局範圍可用
window.toggleLanguage = toggleLanguage;
