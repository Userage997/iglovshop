// Конфигурация магазина
const SHOP_CONFIG = {
    name: "SHOP IGLOVA",
    owner: {
        telegram: "https://t.me/useriglov",
        username: "@useriglov"
    },
    support: {
        telegram: "https://t.me/fuckiglov",
        username: "@fuckiglov"
    },
    productsUrl: 'products.json',
    cacheTime: 5 * 60 * 1000, // 5 минут кэш
    version: "1.0.0"
};

// Тексты для печатающего эффекта
const TYPING_TEXTS = [
    "initializing shop database...",
    "connecting to product storage...",
    "loading available items...",
    "welcome to shop iglova",
    "type 'help' for commands",
    "establishing secure connection...",
    "encryption protocols active...",
    "ready for transactions..."
];

// Глобальные переменные
let productsData = null;
let lastLoadTime = 0;
let currentCategory = 'all';

// Главная функция инициализации
document.addEventListener('DOMContentLoaded', function() {
    console.log(`[${SHOP_CONFIG.name}] v${SHOP_CONFIG.version} initialized`);
    
    // Инициализация эффектов
    initTypingEffect();
    initCyberpunkEffects();
    
    // Инициализация функционала
    initNavigation();
    initCategoryFilter();
    initForceRefresh();
    
    // Загрузка данных если нужно
    if (window.location.hash === '#products' || document.querySelector('#screen-2.active')) {
        setTimeout(() => loadProducts(), 500);
    }
    
    // Периодическое обновление
    setInterval(() => {
        if (document.querySelector('#screen-2.active')) {
            console.log('[SYSTEM] Auto-refreshing products...');
            loadProducts(true); // silent mode
        }
    }, SHOP_CONFIG.cacheTime);
});

// Печатающий текст в футере
function initTypingEffect() {
    const typingElement = document.getElementById('typing-text');
    if (!typingElement) return;
    
    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100;
    
    function type() {
        const currentText = TYPING_TEXTS[textIndex];
        
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
            textIndex = (textIndex + 1) % TYPING_TEXTS.length;
            typingSpeed = 500;
        }
        
        setTimeout(type, typingSpeed);
    }
    
    setTimeout(type, 1000);
}

// Киберпанк эффекты
function initCyberpunkEffects() {
    // Динамическое мерцание ASCII
    setInterval(() => {
        const ascii = document.querySelector('.ascii-large');
        if (ascii) {
            const intensity = 0.5 + Math.random() * 0.5;
            ascii.style.textShadow = `0 0 ${15 + Math.random() * 15}px rgba(0, 255, 255, ${intensity})`;
        }
    }, 2000);
    
    // Эффект загрузки для статуса
    const statusIndicator = document.querySelector('.status-indicator');
    if (statusIndicator) {
        setInterval(() => {
            statusIndicator.style.opacity = statusIndicator.style.opacity === '0.5' ? '1' : '0.5';
        }, 1500);
    }
    
    // Эффект печатной машинки для текста
    setTimeout(() => {
        document.querySelectorAll('.info-line').forEach((el, index) => {
            setTimeout(() => {
                el.style.opacity = '0';
                el.style.transition = 'opacity 0.5s ease';
                setTimeout(() => {
                    el.style.opacity = '1';
                }, 100);
            }, index * 200);
        });
    }, 1000);
    
    // Мерцание промптов
    setInterval(() => {
        document.querySelectorAll('.prompt').forEach(prompt => {
            prompt.style.textShadow = prompt.style.textShadow 
                ? '' 
                : '0 0 10px #00ffff, 0 0 20px #00ffff';
        });
    }, 3000);
}

// Навигация между экранами
function initNavigation() {
    // Основные кнопки навигации
    document.querySelectorAll('.cyber-btn[data-target]').forEach(button => {
        button.addEventListener('click', function() {
            const targetScreenId = this.getAttribute('data-target');
            switchScreen(targetScreenId);
        });
    });
    
    // Кнопки "Назад"
    document.querySelectorAll('.back-btn').forEach(button => {
        button.addEventListener('click', function() {
            const targetScreenId = this.getAttribute('data-target');
            switchScreen(targetScreenId);
        });
    });
    
    // Обработка хэша в URL
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
}

function handleHashChange() {
    const hash = window.location.hash.substring(1);
    if (hash === 'products') {
        switchScreen('screen-2');
    } else if (hash === 'contacts') {
        switchScreen('screen-3');
    }
}

// Переключение экранов
function switchScreen(screenId) {
    const targetScreen = document.getElementById(screenId);
    if (!targetScreen) return;
    
    const activeScreen = document.querySelector('.screen.active');
    
    // Анимация перехода
    if (activeScreen) {
        activeScreen.classList.remove('active');
        setTimeout(() => {
            targetScreen.classList.add('active');
            updateIndicator(screenId);
            
            // Действия при переходе на конкретный экран
            if (screenId === 'screen-2') {
                loadProducts();
                updateHash('products');
            } else if (screenId === 'screen-3') {
                updateHash('contacts');
            } else {
                updateHash('');
            }
        }, 300);
    } else {
        targetScreen.classList.add('active');
        updateIndicator(screenId);
    }
    
    // Плавный скролл наверх
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateHash(hash) {
    if (history.pushState) {
        history.pushState(null, null, hash ? '#' + hash : '.');
    } else {
        window.location.hash = hash || '';
    }
}

// Обновление индикатора экрана
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
            currentCategory = this.getAttribute('data-category');
            
            // Обновляем активную кнопку
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Фильтруем товары
            filterProductsByCategory(currentCategory);
        });
    });
}

// Принудительное обновление
function initForceRefresh() {
    const refreshBtn = document.getElementById('force-refresh');
    if (!refreshBtn) return;
    
    refreshBtn.addEventListener('click', async () => {
        refreshBtn.innerHTML = '<span class="btn-number">[↻]</span><span class="btn-text">ОБНОВЛЕНИЕ...</span>';
        refreshBtn.disabled = true;
        
        // Сбрасываем кэш
        lastLoadTime = 0;
        
        try {
            await loadProducts();
            
            // Успешное обновление
            showUpdateStatus('✅ База товаров обновлена', 'success');
            refreshBtn.innerHTML = '<span class="btn-number">[✓]</span><span class="btn-text">ОБНОВЛЕНО</span>';
            
            setTimeout(() => {
                refreshBtn.innerHTML = '<span class="btn-number">[↻]</span><span class="btn-text">ОБНОВИТЬ БАЗУ ТОВАРОВ</span>';
                refreshBtn.disabled = false;
            }, 2000);
            
        } catch (error) {
            // Ошибка обновления
            showUpdateStatus('❌ Ошибка обновления', 'error');
            refreshBtn.innerHTML = '<span class="btn-number">[✗]</span><span class="btn-text">ОШИБКА</span>';
            
            setTimeout(() => {
                refreshBtn.innerHTML = '<span class="btn-number">[↻]</span><span class="btn-text">ОБНОВИТЬ БАЗУ ТОВАРОВ</span>';
                refreshBtn.disabled = false;
            }, 3000);
        }
    });
}

function showUpdateStatus(message, type = 'info') {
    const statusElement = document.getElementById('update-status');
    if (!statusElement) return;
    
    statusElement.textContent = message;
    statusElement.className = 'update-status';
    
    if (type === 'success') {
        statusElement.style.color = '#00ff00';
    } else if (type === 'error') {
        statusElement.style.color = '#ff3333';
    } else {
        statusElement.style.color = '#00ffff';
    }
    
    setTimeout(() => {
        statusElement.textContent = '';
    }, 5000);
}

// Загрузка товаров
async function loadProducts(silent = false) {
    const container = document.getElementById('products-container');
    const updateElement = document.getElementById('last-update');
    
    if (!container) return;
    
    // Показываем загрузку
    if (!silent) {
        container.innerHTML = `
            <div class="loading-products">
                <div class="loading-spinner"></div>
                <p>ЗАГРУЗКА БАЗЫ ТОВАРОВ...</p>
                <p class="loading-subtext">Подключение к хранилищу данных...</p>
            </div>
        `;
    }
    
    try {
        // Проверяем кэш
        const now = Date.now();
        const useCache = productsData && (now - lastLoadTime) < SHOP_CONFIG.cacheTime;
        
        if (useCache && !silent) {
            console.log('[CACHE] Using cached products');
            displayProducts(productsData);
            updateLastUpdate(updateElement, productsData.last_update, true);
            return;
        }
        
        // Загружаем данные
        console.log('[API] Fetching products...');
        const timestamp = silent ? 't=' + now : 'nocache=' + Math.random();
        const response = await fetch(`${SHOP_CONFIG.productsUrl}?${timestamp}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Валидация данных
        if (!data.categories || !Array.isArray(data.categories)) {
            throw new Error('Invalid products data structure');
        }
        
        // Сохраняем в кэш
        productsData = data;
        lastLoadTime = now;
        
        // Отображаем товары
        displayProducts(data);
        
        // Обновляем время
        updateLastUpdate(updateElement, data.last_update);
        
        if (!silent) {
            console.log(`[API] Loaded ${data.categories.reduce((sum, cat) => sum + (cat.products?.length || 0), 0)} products`);
        }
        
    } catch (error) {
        console.error('[ERROR] Failed to load products:', error);
        
        if (!silent) {
            container.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>ОШИБКА ЗАГРУЗКИ ТОВАРОВ</h3>
                    <p>Не удалось подключиться к базе данных</p>
                    <p style="color: #888; font-size: 0.9rem;">${error.message}</p>
                    <div style="margin-top: 20px;">
                        <a href="${SHOP_CONFIG.owner.telegram}" target="_blank" class="buy-btn">
                            <i class="fab fa-telegram"></i> Сообщить об ошибке
                        </a>
                    </div>
                </div>
            `;
        }
        
        if (updateElement) {
            updateElement.textContent = 'Ошибка загрузки';
            updateElement.style.color = '#ff3333';
        }
    }
}

function updateLastUpdate(element, timestamp, cached = false) {
    if (!element) return;
    
    if (timestamp) {
        element.textContent = `Обновлено: ${timestamp} ${cached ? '(кеш)' : ''}`;
        element.style.color = cached ? '#888' : '#00ff00';
    } else {
        element.textContent = 'Время обновления неизвестно';
        element.style.color = '#ff9900';
    }
}

// Отображение товаров
function displayProducts(data) {
    const container = document.getElementById('products-container');
    if (!container || !data || !data.categories) return;
    
    // Собираем все товары
    let allProducts = [];
    data.categories.forEach(category => {
        if (category.products && Array.isArray(category.products)) {
            category.products.forEach(product => {
                allProducts.push({
                    ...product,
                    categoryId: category.id,
                    categoryName: category.name,
                    categoryIcon: category.icon || '📱'
                });
            });
        }
    });
    
    // Если нет товаров
    if (allProducts.length === 0) {
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-box-open"></i>
                <h3>ТОВАРОВ ПОКА НЕТ</h3>
                <p>В базе данных отсутствуют товары</p>
                <p style="color: #888;">Скоро появятся новые поступления!</p>
            </div>
        `;
        return;
    }
    
    // Сортируем по цене (дорогие сначала)
    allProducts.sort((a, b) => {
        const priceA = extractPrice(a.price);
        const priceB = extractPrice(b.price);
        return priceB - priceA;
    });
    
    // Генерируем HTML
    container.innerHTML = `
        <div class="products-grid">
            ${allProducts.map((product, index) => createProductCard(product, index)).join('')}
        </div>
    `;
    
    // Применяем текущий фильтр
    filterProductsByCategory(currentCategory);
}

function extractPrice(priceStr) {
    if (!priceStr) return 0;
    const match = priceStr.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
}

// Создание карточки товара
function createProductCard(product, index) {
    const isHighlight = product.months && parseInt(product.months) >= 6;
    const delay = index * 50;
    
    return `
        <div class="product-card ${isHighlight ? 'highlight' : ''}" 
             data-category="${product.categoryId}"
             style="animation-delay: ${delay}ms;">
            
            <div class="product-header">
                <div class="product-number">${formatProductNumber(product)}</div>
                <div class="product-price">${product.price || 'Цена не указана'}</div>
            </div>
            
            ${product.description ? `<p style="color: #ccc; margin: 10px 0; font-size: 0.9rem;">${product.description}</p>` : ''}
            
            <div class="product-details">
                ${product.months ? `
                    <div class="detail-item">
                        <span class="detail-label">Срок отлета:</span>
                        <span class="detail-value">${product.months} мес</span>
                    </div>
                ` : ''}
                
                ${product.operator ? `
                    <div class="detail-item">
                        <span class="detail-label">Оператор:</span>
                        <span class="detail-value">${product.operator}</span>
                    </div>
                ` : ''}
                
                ${product.country ? `
                    <div class="detail-item">
                        <span class="detail-label">Страна:</span>
                        <span class="detail-value">${product.country}</span>
                    </div>
                ` : ''}
                
                ${product.type ? `
                    <div class="detail-item">
                        <span class="detail-label">Тип:</span>
                        <span class="detail-value">${product.type}</span>
                    </div>
                ` : ''}
            </div>
            
            <span class="product-category">${product.categoryIcon} ${product.categoryName}</span>
            
            <a href="${SHOP_CONFIG.owner.telegram}?text=${encodeURIComponent(getOrderMessage(product))}" 
               target="_blank" 
               class="buy-btn"
               title="Купить через Telegram">
                <i class="fab fa-telegram"></i> КУПИТЬ (Telegram)
            </a>
        </div>
    `;
}

function formatProductNumber(product) {
    if (product.number) {
        // Форматируем номер телефона
        const cleanNum = product.number.replace(/\D/g, '');
        if (cleanNum.length === 11) {
            return `+${cleanNum[0]} (${cleanNum.substring(1, 4)}) ${cleanNum.substring(4, 7)}-${cleanNum.substring(7, 9)}-${cleanNum.substring(9)}`;
        }
        return product.number;
    }
    return product.name || 'Товар #' + Math.random().toString(36).substr(2, 5);
}

function getOrderMessage(product) {
    const itemName = product.number || product.name || 'товар';
    const price = product.price || 'цена не указана';
    
    return `Здравствуйте! Хочу купить товар из SHOP IGLOVA:\n\n` +
           `🔹 Товар: ${itemName}\n` +
           `🔹 Цена: ${price}\n` +
           `🔹 Категория: ${product.categoryName}\n\n` +
           `Готов(а) к оплате.`;
}

// Фильтрация товаров по категории
function filterProductsByCategory(category) {
    const allCards = document.querySelectorAll('.product-card');
    let visibleCount = 0;
    
    allCards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        const shouldShow = category === 'all' || cardCategory === category;
        
        if (shouldShow) {
            card.style.display = 'block';
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 10);
            visibleCount++;
        } else {
            card.style.opacity = '0';
            card.style.transform = 'translateY(10px)';
            setTimeout(() => {
                card.style.display = 'none';
            }, 300);
        }
    });
    
    // Если нет товаров в категории
    if (visibleCount === 0 && category !== 'all') {
        const container = document.getElementById('products-container');
        if (container) {
            const message = document.createElement('div');
            message.className = 'error-message';
            message.innerHTML = `
                <i class="fas fa-search"></i>
                <h3>ТОВАРОВ НЕ НАЙДЕНО</h3>
                <p>В категории "${getCategoryName(category)}" пока нет товаров</p>
                <button class="cyber-btn small" onclick="document.querySelector('[data-category=\\'all\\']').click()" 
                        style="margin-top: 15px;">
                    <span class="btn-number">[←]</span>
                    <span>ВЕРНУТЬСЯ КО ВСЕМ ТОВАРАМ</span>
                </button>
            `;
            
            // Находим сетку товаров и заменяем
            const grid = container.querySelector('.products-grid');
            if (grid) {
                container.insertBefore(message, grid);
                grid.style.display = 'none';
            }
        }
    } else {
        // Восстанавливаем отображение сетки
        const container = document.getElementById('products-container');
        if (container) {
            const grid = container.querySelector('.products-grid');
            if (grid) {
                grid.style.display = 'grid';
            }
            
            // Удаляем сообщение если есть
            const existingMessage = container.querySelector('.error-message');
            if (existingMessage && existingMessage.querySelector('.fa-search')) {
                existingMessage.remove();
            }
        }
    }
}

function getCategoryName(categoryId) {
    const categories = {
        'all': 'Все товары',
        'russian': 'Номера РФ',
        'foreign': 'Зарубежные номера',
        'nft_users': 'NFT Юзеры',
        'nft_gifts': 'NFT Подарки'
    };
    
    return categories[categoryId] || categoryId;
}

// Экспортируем нужные функции в глобальную область видимости
window.filterProductsByCategory = filterProductsByCategory;
