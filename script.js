// Конфигурация магазина
const SHOP_CONFIG = {
    name: "IGLOV SHOP",
    owner: {
        telegram: "https://t.me/useriglov",
        username: "@useriglov"
    },
    support: {
        telegram: "https://t.me/fuckiglov",
        username: "@fuckiglov"
    },
    productsUrl: 'products.json',
    localStorageKey: 'iglova_shop_products_data',
    cacheTime: 5 * 60 * 1000, // 5 минут кэш
    version: "2.0"
};

// Тексты для печатающего эффекта
const TYPING_TEXTS = [
    "initializing shop database...",
    "connecting to product storage...",
    "loading available items...",
    "welcome to iglov shop",
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
    initSimpleEffects();
    
    // Инициализация функционала
    initNavigation();
    initCategoryFilter();
    initForceRefresh();
    
    // Проверяем хэш и загружаем товары если нужно
    checkHashAndLoad();
    
    // Периодическое обновление
    setInterval(() => {
        if (document.querySelector('#screen-2.active')) {
            console.log('[SYSTEM] Auto-refreshing products...');
            loadProducts(true); // silent mode
        }
    }, SHOP_CONFIG.cacheTime);
});

// Проверка хэша и загрузка товаров
function checkHashAndLoad() {
    const hash = window.location.hash.substring(1);
    if (hash === 'products' || document.querySelector('#screen-2.active')) {
        setTimeout(() => loadProducts(), 300);
    }
}

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

// Простые эффекты без нагрузки
function initSimpleEffects() {
    // Мерцание статуса
    const statusIndicator = document.querySelector('.status-indicator');
    if (statusIndicator) {
        setInterval(() => {
            statusIndicator.style.opacity = statusIndicator.style.opacity === '0.7' ? '1' : '0.7';
        }, 2000);
    }
    
    // Редкое мерцание промптов
    setInterval(() => {
        if (Math.random() > 0.8) {
            document.querySelectorAll('.prompt').forEach(prompt => {
                prompt.style.textShadow = '0 0 10px #00ffff';
                setTimeout(() => {
                    prompt.style.textShadow = '';
                }, 300);
            });
        }
    }, 5000);
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
    // Если нажали админку - открываем в новой вкладке
    if (screenId === 'admin') {
        window.open('admin/admin.html', '_blank');
        return;
    }
    
    const targetScreen = document.getElementById(screenId);
    if (!targetScreen) return;
    
    const activeScreen = document.querySelector('.screen.active');
    
    // Простая анимация перехода
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
            
            // Простой эффект для активной кнопки
            this.classList.add('flash-once');
            setTimeout(() => this.classList.remove('flash-once'), 500);
            
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
        productsData = null;
        
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
            showUpdateStatus('❌ Ошибка обновления: ' + error.message, 'error');
            refreshBtn.innerHTML = '<span class="btn-number">[✗]</span><span class="btn-text">ОШИБКА</span>';
            refreshBtn.classList.add('vibrate-on-error');
            
            setTimeout(() => {
                refreshBtn.innerHTML = '<span class="btn-number">[↻]</span><span class="btn-text">ОБНОВИТЬ БАЗУ ТОВАРОВ</span>';
                refreshBtn.disabled = false;
                refreshBtn.classList.remove('vibrate-on-error');
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
        statusElement.style.textShadow = '0 0 10px #00ff00';
    } else if (type === 'error') {
        statusElement.style.color = '#ff3333';
        statusElement.style.textShadow = '0 0 10px #ff3333';
    } else {
        statusElement.style.color = '#00ffff';
    }
    
    setTimeout(() => {
        statusElement.textContent = '';
        statusElement.style.textShadow = '';
    }, 5000);
}

// Загрузка товаров
async function loadProducts(silent = false) {
    const container = document.getElementById('products-container');
    const updateElement = document.getElementById('last-update');
    
    console.log('[LOAD] Начинаю загрузку товаров...');
    
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
        // Пробуем загрузить из кэша браузера
        const now = Date.now();
        const cachedData = getCachedData();
        
        if (cachedData && (now - lastLoadTime) < SHOP_CONFIG.cacheTime && !silent) {
            console.log('[CACHE] Использую кэшированные данные');
            productsData = cachedData;
            displayProducts(cachedData);
            updateLastUpdate(updateElement, cachedData.last_update, true);
            return;
        }
        
        // Пробуем загрузить с сервера
        console.log('[API] Пробую загрузить с сервера...');
        const serverData = await loadFromServer();
        
        if (serverData) {
            productsData = serverData;
            lastLoadTime = now;
            cacheData(serverData);
            displayProducts(serverData);
            updateLastUpdate(updateElement, serverData.last_update);
            console.log(`[API] Загружено ${countProducts(serverData)} товаров с сервера`);
            return;
        }
        
        // Пробуем загрузить из localStorage админки
        console.log('[FALLBACK] Пробую localStorage...');
        console.log('[DEBUG] Ключи в localStorage:', Object.keys(localStorage));
        
        const localData = await loadFromLocalStorage();
        
        if (localData) {
            productsData = localData;
            lastLoadTime = now;
            cacheData(localData);
            displayProducts(localData);
            updateLastUpdate(updateElement, localData.last_update, true);
            console.log(`[FALLBACK] Загружено ${countProducts(localData)} товаров из localStorage`);
            return;
        }
        
        // Если ничего не получилось
        throw new Error('Не удалось загрузить данные из всех источников');
        
    } catch (error) {
        console.error('[ERROR] Ошибка загрузки товаров:', error);
        
        if (!silent) {
            showErrorMessage(container, error.message);
        }
        
        if (updateElement) {
            updateElement.textContent = 'Ошибка загрузки';
            updateElement.style.color = '#ff3333';
        }
    }
}

// Загрузка с сервера
async function loadFromServer() {
    try {
        const timestamp = Date.now();
        const response = await fetch(`${SHOP_CONFIG.productsUrl}?_=${timestamp}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        // Проверяем структуру данных
        if (!data || !Array.isArray(data.categories)) {
            throw new Error('Invalid data structure');
        }
        
        return data;
    } catch (error) {
        console.warn('[SERVER] Failed to load from server:', error.message);
        return null;
    }
}

// Загрузка из localStorage
async function loadFromLocalStorage() {
    try {
        // Пробуем несколько ключей - ВАЖНО: именно эти ключи использует админка!
        const keys = [
            'iglova_shop_products',           // Основной ключ из админки
            'iglova_admin_data_v3',           // Ключ из админки
            'iglova_shop_products_data'       // Резервный ключ
        ];
        
        for (const key of keys) {
            const rawData = localStorage.getItem(key);
            if (rawData) {
                console.log(`[STORAGE] Найдены данные в ключе: ${key}`);
                
                try {
                    const parsedData = JSON.parse(rawData);
                    
                    // Проверяем несколько возможных форматов
                    if (parsedData.categories && Array.isArray(parsedData.categories)) {
                        // Формат 1: данные уже в правильной структуре
                        console.log('[FORMAT] Данные в правильном формате');
                        return parsedData;
                    } else if (parsedData.products && Array.isArray(parsedData.products)) {
                        // Формат 2: данные из админки (продукты отдельно)
                        console.log('[FORMAT] Преобразуем данные из админки');
                        return formatDataForDisplay(parsedData);
                    } else if (parsedData.data && parsedData.data.categories) {
                        // Формат 3: данные из кэша
                        console.log('[FORMAT] Данные из кэша');
                        return parsedData.data;
                    }
                } catch (parseError) {
                    console.warn(`[ERROR] Ошибка парсинга данных из ключа ${key}:`, parseError);
                    continue;
                }
            }
        }
        
        console.log('[STORAGE] Нет данных в localStorage');
        return null;
    } catch (error) {
        console.error('[ERROR] Ошибка загрузки из localStorage:', error);
        return null;
    }
}

// Форматирование данных из админки для отображения
function formatDataForDisplay(rawData) {
    try {
        console.log('[FORMAT] Преобразование данных:', rawData);
        
        // Если данные уже в правильном формате
        if (rawData.categories && Array.isArray(rawData.categories)) {
            return {
                last_update: rawData.last_update || new Date().toLocaleString('ru-RU'),
                version: rawData.version || '1.0',
                categories: rawData.categories
            };
        }
        
        // Если это данные из админки (продукты отдельно)
        if (rawData.products && Array.isArray(rawData.products)) {
            const categories = [
                { id: "russian", name: "НОМЕРА РФ", icon: "🇷🇺", description: "Российские номера с гарантией отлета", products: [] },
                { id: "foreign", name: "ЗАРУБЕЖНЫЕ", icon: "🌍", description: "Номера других стран", products: [] },
                { id: "nft_users", name: "NFT ЮЗЕРЫ", icon: "🎨", description: "NFT аккаунты и профили", products: [] },
                { id: "nft_gifts", name: "NFT ПОДАРКИ", icon: "🎁", description: "Цифровые подарки и активы", products: [] }
            ];
            
            // Добавляем товары в категории
            rawData.products.forEach(product => {
                const category = categories.find(c => c.id === product.categoryId);
                if (category) {
                    category.products.push({
                        number: product.number,
                        price: product.price,
                        months: product.months,
                        operator: product.operator,
                        description: product.description
                    });
                }
            });
            
            // Фильтруем только категории с товарами
            const filteredCategories = categories.filter(cat => cat.products.length > 0);
            
            return {
                last_update: rawData.timestamp ? new Date(rawData.timestamp).toLocaleString('ru-RU') : 'Только что',
                version: rawData.version || '1.0',
                categories: filteredCategories
            };
        }
        
        console.warn('[FORMAT] Неизвестный формат данных:', rawData);
        return null;
    } catch (error) {
        console.error('[FORMAT] Ошибка форматирования данных:', error);
        return null;
    }
}

// Кэширование данных
function cacheData(data) {
    try {
        const cache = {
            data: data,
            timestamp: Date.now()
        };
        localStorage.setItem(SHOP_CONFIG.localStorageKey, JSON.stringify(cache));
    } catch (error) {
        console.warn('[CACHE] Failed to cache data:', error);
    }
}

// Получение данных из кэша
function getCachedData() {
    try {
        const cached = localStorage.getItem(SHOP_CONFIG.localStorageKey);
        if (cached) {
            const cache = JSON.parse(cached);
            // Проверяем не устарели ли данные
            if (Date.now() - cache.timestamp < SHOP_CONFIG.cacheTime * 24) { // 24 часа максимум
                return cache.data;
            }
        }
    } catch (error) {
        console.warn('[CACHE] Failed to get cached data:', error);
    }
    return null;
}

// Подсчет товаров
function countProducts(data) {
    if (!data || !data.categories) return 0;
    return data.categories.reduce((sum, cat) => sum + (cat.products?.length || 0), 0);
}

// Показать сообщение об ошибке
function showErrorMessage(container, errorMsg) {
    container.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>ОШИБКА ЗАГРУЗКИ ТОВАРОВ</h3>
            <p>Не удалось подключиться к базе данных</p>
            <p style="color: #888; font-size: 0.9rem;">${errorMsg}</p>
            <div class="error-actions">
                <button onclick="loadProducts()" class="buy-btn">
                    <i class="fas fa-redo"></i> Попробовать снова
                </button>
                <a href="${SHOP_CONFIG.owner.telegram}" target="_blank" class="buy-btn">
                    <i class="fab fa-telegram"></i> Сообщить об ошибке
                </a>
            </div>
        </div>
    `;
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
            <div class="no-products-message">
                <i class="fas fa-box-open"></i>
                <h3>ТОВАРОВ ПОКА НЕТ</h3>
                <p>В базе данных отсутствуют товары</p>
                <p style="color: #888; margin-top: 10px;">Добавьте товары через админ-панель</p>
                <button onclick="window.open('admin/admin.html', '_blank')" class="buy-btn" style="margin-top: 20px;">
                    <i class="fas fa-cogs"></i> Перейти в админ-панель
                </button>
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
            
            ${product.description ? `<p class="product-description">${product.description}</p>` : ''}
            
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
        } else if (cleanNum.length === 12) {
            return `+${cleanNum.substring(0, 2)} (${cleanNum.substring(2, 5)}) ${cleanNum.substring(5, 8)}-${cleanNum.substring(8, 10)}-${cleanNum.substring(10)}`;
        }
        return product.number;
    }
    return product.name || 'Товар #' + Math.random().toString(36).substr(2, 5);
}

function getOrderMessage(product) {
    const itemName = product.number || product.name || 'товар';
    const price = product.price || 'цена не указана';
    
    return `Здравствуйте! Хочу купить товар из IGLOV SHOP:\n\n` +
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
            message.className = 'no-category-message';
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
            const existingMessage = container.querySelector('.no-category-message');
            if (existingMessage) {
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

// Добавляем CSS для новых сообщений
const additionalStyles = `
    .error-message .error-actions {
        display: flex;
        gap: 10px;
        margin-top: 20px;
        flex-wrap: wrap;
    }
    
    .error-message .error-actions .buy-btn {
        flex: 1;
        min-width: 200px;
    }
    
    .no-products-message {
        text-align: center;
        padding: 50px;
        color: #888;
        background: rgba(0, 20, 0, 0.2);
        border-radius: 10px;
        border: 1px solid rgba(0, 255, 0, 0.2);
    }
    
    .no-products-message i {
        font-size: 3rem;
        color: #00ffff;
        margin-bottom: 20px;
        display: block;
    }
    
    .no-category-message {
        text-align: center;
        padding: 40px;
        color: #888;
        background: rgba(0, 20, 0, 0.2);
        border-radius: 10px;
        border: 1px solid rgba(0, 255, 0, 0.2);
        margin-bottom: 20px;
    }
    
    .no-category-message i {
        font-size: 2.5rem;
        color: #00ffff;
        margin-bottom: 15px;
        display: block;
    }
    
    .product-description {
        color: #ccc;
        margin: 10px 0;
        font-size: 0.9rem;
        line-height: 1.4;
    }
    
    .product-card {
        animation: fadeInUp 0.5s ease forwards;
        opacity: 0;
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;

// Добавляем стили в документ
const styleElement = document.createElement('style');
styleElement.textContent = additionalStyles;
document.head.appendChild(styleElement);

// Экспортируем нужные функции в глобальную область видимости
window.filterProductsByCategory = filterProductsByCategory;
window.loadProducts = loadProducts;
