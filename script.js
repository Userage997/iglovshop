// Основные настройки
const CONFIG = {
    productsUrl: 'products.json',
    cacheTime: 5 * 60 * 1000, // 5 минут кэш
    ownerTelegram: 'https://t.me/useriglov'
};

// Тексты для печатающего эффекта
const typingTexts = [
    "loading shop catalog...",
    "connecting to database...",
    "products loaded successfully",
    "welcome to shop iglova",
    "type 'help' for commands"
];

// Главная функция
document.addEventListener('DOMContentLoaded', function() {
    initTypingEffect();
    initNavigation();
    initProducts();
    initCategoryFilter();
    initExtraHandlers();
});

// Печатающий текст
function initTypingEffect() {
    const typingElement = document.getElementById('typing-text');
    if (!typingElement) return;
    
    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100;
    
    function type() {
        const currentText = typingTexts[textIndex];
        
        if (isDeleting) {
            typingElement.textContent = currentText.substring(0, charIndex - 1);
            charIndex--;
            typingSpeed = 50;
        } else {
            typingElement.textContent = currentText.substring(0, charIndex + 1);
            charIndex++;
            typingSpeed = 100;
        }
        
        if (!isDeleting && charIndex === currentText.length) {
            isDeleting = true;
            typingSpeed = 1500;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            textIndex = (textIndex + 1) % typingTexts.length;
            typingSpeed = 500;
        }
        
        setTimeout(type, typingSpeed);
    }
    
    setTimeout(type, 1000);
}

// Навигация
function initNavigation() {
    document.querySelectorAll('.cyber-btn[data-target]').forEach(button => {
        button.addEventListener('click', function() {
            const targetScreenId = this.getAttribute('data-target');
            switchScreen(targetScreenId);
        });
    });
    
    document.querySelectorAll('.back-btn').forEach(button => {
        button.addEventListener('click', function() {
            const targetScreenId = this.getAttribute('data-target');
            switchScreen(targetScreenId);
        });
    });
}

// Переключение экранов
function switchScreen(screenId) {
    const targetScreen = document.getElementById(screenId);
    if (!targetScreen) return;
    
    const activeScreen = document.querySelector('.screen.active');
    
    if (activeScreen) {
        activeScreen.classList.remove('active');
        setTimeout(() => {
            targetScreen.classList.add('active');
            updateIndicator(screenId);
            
            // Если переходим на экран товаров - загружаем
            if (screenId === 'screen-2') {
                loadProducts();
            }
        }, 300);
    } else {
        targetScreen.classList.add('active');
        updateIndicator(screenId);
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Обновление индикатора
function updateIndicator(screenId) {
    const screenNumber = parseInt(screenId.split('-')[1]);
    document.querySelectorAll('.indicator-dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === screenNumber - 1);
    });
}

// Фильтр категорий
function initCategoryFilter() {
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            
            // Обновляем активную кнопку
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Фильтруем товары
            filterProductsByCategory(category);
        });
    });
}

// Загрузка товаров
let productsData = null;
let lastLoadTime = 0;

async function initProducts() {
    // Загружаем при первом открытии
    if (window.location.hash === '#products' || document.querySelector('#screen-2.active')) {
        await loadProducts();
    }
}

async function loadProducts() {
    const container = document.getElementById('products-container');
    const updateElement = document.getElementById('last-update');
    
    if (!container) return;
    
    // Показываем загрузку
    container.innerHTML = `
        <div class="loading-products">
            <div class="loading-spinner"></div>
            <p>Загрузка товаров...</p>
        </div>
    `;
    
    try {
        // Проверяем кэш
        const now = Date.now();
        if (productsData && (now - lastLoadTime) < CONFIG.cacheTime) {
            displayProducts(productsData);
            return;
        }
        
        // Загружаем с timestamp для избежания кэша
        const response = await fetch(`${CONFIG.productsUrl}?t=${now}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Сохраняем в кэш
        productsData = data;
        lastLoadTime = now;
        
        // Отображаем
        displayProducts(data);
        
        // Обновляем время
        if (updateElement && data.last_update) {
            updateElement.textContent = `Обновлено: ${data.last_update}`;
        }
        
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        container.innerHTML = `
            <div class="error-message">
                <p><i class="fas fa-exclamation-triangle"></i> Ошибка загрузки товаров</p>
                <p>Пожалуйста, попробуйте позже или свяжитесь с владельцем</p>
                <a href="${CONFIG.ownerTelegram}" target="_blank" class="buy-btn" style="margin-top: 15px;">
                    Связаться с владельцем
                </a>
            </div>
        `;
        
        if (updateElement) {
            updateElement.textContent = 'Ошибка загрузки';
        }
    }
}

// Отображение товаров
function displayProducts(data) {
    const container = document.getElementById('products-container');
    if (!container || !data || !data.categories) return;
    
    // Собираем все товары в один массив
    let allProducts = [];
    data.categories.forEach(category => {
        category.products.forEach(product => {
            allProducts.push({
                ...product,
                categoryId: category.id,
                categoryName: category.name,
                categoryIcon: category.icon
            });
        });
    });
    
    // Сортируем по цене (дорогие сначала)
    allProducts.sort((a, b) => {
        const priceA = parseInt(a.price) || 0;
        const priceB = parseInt(b.price) || 0;
        return priceB - priceA;
    });
    
    // Генерируем HTML
    if (allProducts.length === 0) {
        container.innerHTML = `
            <div class="error-message">
                <p><i class="fas fa-box-open"></i> Товаров пока нет</p>
                <p>Скоро появятся новые поступления!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="products-grid">
            ${allProducts.map(product => createProductCard(product)).join('')}
        </div>
    `;
}

// Создание карточки товара
function createProductCard(product) {
    const isHighlight = product.months && parseInt(product.months) >= 6;
    
    return `
        <div class="product-card ${isHighlight ? 'highlight' : ''}" data-category="${product.categoryId}">
            <div class="product-header">
                <div class="product-number">${product.number || product.name || 'Товар'}</div>
                <div class="product-price">${product.price || 'Цена не указана'}</div>
            </div>
            
            ${product.description ? `<p style="color: #ccc; margin: 10px 0;">${product.description}</p>` : ''}
            
            <div class="product-details">
                ${product.months ? `
                    <div class="detail-item">
                        <span class="detail-label">Срок отлета:</span>
                        <span class="detail-value">${product.months} мес</span>
                    </div>
                ` : ''}
                
                ${product.country ? `
                    <div class="detail-item">
                        <span class="detail-label">Страна:</span>
                        <span class="detail-value">${product.country}</span>
                    </div>
                ` : ''}
                
                ${product.operator ? `
                    <div class="detail-item">
                        <span class="detail-label">Оператор:</span>
                        <span class="detail-value">${product.operator}</span>
                    </div>
                ` : ''}
            </div>
            
            <span class="product-category">${product.categoryIcon || '📱'} ${product.categoryName}</span>
            
            <a href="${CONFIG.ownerTelegram}?text=Хочу купить: ${encodeURIComponent(product.number || product.name)}" 
               target="_blank" 
               class="buy-btn">
                <i class="fab fa-telegram"></i> Купить
            </a>
        </div>
    `;
}

// Фильтрация товаров по категории
function filterProductsByCategory(category) {
    const allCards = document.querySelectorAll('.product-card');
    
    allCards.forEach(card => {
        if (category === 'all' || card.getAttribute('data-category') === category) {
            card.style.display = 'block';
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 10);
        } else {
            card.style.opacity = '0';
            card.style.transform = 'translateY(10px)';
            setTimeout(() => {
                card.style.display = 'none';
            }, 300);
        }
    });
}

// Дополнительные обработчики
function initExtraHandlers() {
    // Обновление статуса
    setInterval(() => {
        const statusIndicator = document.querySelector('.status-indicator.active');
        if (statusIndicator) {
            statusIndicator.style.opacity = statusIndicator.style.opacity === '0.5' ? '1' : '0.5';
        }
    }, 2000);
    
    // Кнопка принудительного обновления
    const forceRefreshBtn = document.createElement('button');
    forceRefreshBtn.className = 'cyber-btn small';
    forceRefreshBtn.innerHTML = '<span>[↻]</span><span>Обновить товары</span>';
    forceRefreshBtn.style.margin = '20px auto';
    forceRefreshBtn.style.display = 'block';
    
    forceRefreshBtn.addEventListener('click', async () => {
        lastLoadTime = 0; // Сбрасываем кэш
        await loadProducts();
        
        // Анимация подтверждения
        forceRefreshBtn.innerHTML = '<span>[✓]</span><span>Товары обновлены!</span>';
        setTimeout(() => {
            forceRefreshBtn.innerHTML = '<span>[↻]</span><span>Обновить товары</span>';
        }, 2000);
    });
    
    // Добавляем кнопку в контейнер товаров
    const productsContainer = document.getElementById('products-container');
    if (productsContainer) {
        productsContainer.parentNode.insertBefore(forceRefreshBtn, productsContainer.nextSibling);
    }
}

// Автоматическое обновление каждые 5 минут
setInterval(() => {
    if (document.querySelector('#screen-2.active')) {
        loadProducts();
    }
}, CONFIG.cacheTime);
