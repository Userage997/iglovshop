// ====== IGLOV SHOP - ОСНОВНОЙ САЙТ ======

let allProductsData = null;
let currentCategory = 'all';

// Синхронизация с админкой
let siteSyncChannel;
try {
    siteSyncChannel = new BroadcastChannel('iglova_shop_sync');
    
    siteSyncChannel.onmessage = function(event) {
        console.log('[SITE] Получены данные от админки:', event.data.type);
        
        if (event.data.type === 'data_updated') {
            console.log('[SITE] Обновление товаров...');
            
            // Сохраняем данные
            allProductsData = event.data.data;
            localStorage.setItem('iglova_shop_products', JSON.stringify(allProductsData));
            
            // Обновляем отображение
            displaySiteProducts(allProductsData);
            
            // Показываем уведомление
            showSiteNotification('🔄 Товары обновлены!', 'success');
            
            // Обновляем время
            updateLastUpdateTime();
        }
    };
} catch (e) {
    console.log('[SITE] Синхронизация недоступна');
}

// Функция для переключения экранов
function switchScreen(screenId) {
    console.log('[UI] Переключение на экран:', screenId);
    
    // Скрываем все экраны
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Показываем нужный экран
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
        
        // Обновляем индикаторы точек
        updateScreenIndicators(screenId);
        
        // Если переходим на экран товаров - обновляем их
        if (screenId === 'screen-2') {
            loadProducts();
        }
    }
}

// Обновление индикаторов экранов
function updateScreenIndicators(screenId) {
    const dots = document.querySelectorAll('.indicator-dot');
    dots.forEach((dot, index) => {
        dot.classList.remove('active');
        if ((screenId === 'screen-1' && index === 0) ||
            (screenId === 'screen-2' && index === 1) ||
            (screenId === 'screen-3' && index === 2)) {
            dot.classList.add('active');
        }
    });
}

// Инициализация кнопок навигации
function initNavigation() {
    // Кнопки перехода
    document.querySelectorAll('[data-target]').forEach(button => {
        button.addEventListener('click', function() {
            const target = this.getAttribute('data-target');
            
            if (target === 'admin') {
                openAdminPanel();
            } else {
                switchScreen(target);
            }
        });
    });
    
    // Кнопки "Назад"
    document.querySelectorAll('.back-btn').forEach(button => {
        button.addEventListener('click', function() {
            const target = this.getAttribute('data-target');
            switchScreen(target);
        });
    });
    
    // Кнопка принудительного обновления
    const refreshBtn = document.getElementById('force-refresh');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            forceRefreshProducts();
        });
    }
    
    console.log('[UI] Навигация инициализирована');
}

// Принудительное обновление товаров
function forceRefreshProducts() {
    console.log('[SITE] Принудительное обновление товаров');
    
    // Очищаем localStorage
    localStorage.removeItem('iglova_shop_products');
    
    // Показываем загрузку
    const container = document.getElementById('products-container');
    if (container) {
        container.innerHTML = `
            <div class="loading-products">
                <div class="loading-spinner"></div>
                <p>ОБНОВЛЕНИЕ БАЗЫ ДАННЫХ...</p>
                <p class="loading-subtext">Подключение к серверу...</p>
            </div>
        `;
    }
    
    // Показываем статус
    const statusElement = document.getElementById('update-status');
    if (statusElement) {
        statusElement.innerHTML = `
            <div class="status-loading">
                <i class="fas fa-sync fa-spin"></i> Загрузка актуальных данных...
            </div>
        `;
    }
    
    // Загружаем заново
    setTimeout(() => {
        loadProducts();
        showSiteNotification('🔄 База товаров обновлена', 'success');
        
        if (statusElement) {
            statusElement.innerHTML = `
                <div class="status-success">
                    <i class="fas fa-check-circle"></i> Данные обновлены
                </div>
            `;
            setTimeout(() => {
                statusElement.innerHTML = '';
            }, 3000);
        }
    }, 1000);
}

// Уведомления на сайте
function showSiteNotification(message, type = 'info') {
    // Удаляем старое уведомление
    const oldNote = document.querySelector('.site-notification');
    if (oldNote) oldNote.remove();
    
    const notification = document.createElement('div');
    notification.className = `site-notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    // Автоудаление через 3 секунды
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

// ФУНКЦИЯ ОТОБРАЖЕНИЯ ТОВАРОВ НА САЙТЕ
function displaySiteProducts(productsData) {
    const container = document.getElementById('products-container');
    if (!container) {
        console.log('[SITE] Контейнер товаров не найден');
        return;
    }
    
    console.log('[SITE] Отображение товаров...');
    
    // Если нет данных
    if (!productsData || !productsData.categories || productsData.categories.length === 0) {
        container.innerHTML = `
            <div class="no-products">
                <i class="fas fa-box-open"></i>
                <h3>Товаров пока нет</h3>
                <p>Скоро появятся новые товары. Загляните позже!</p>
                <p class="loading-subtext">Используйте админ-панель для добавления товаров</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    let filteredCategories = productsData.categories;
    
    // Фильтрация по выбранной категории
    if (currentCategory !== 'all') {
        filteredCategories = productsData.categories.filter(cat => cat.id === currentCategory);
    }
    
    // Показываем категории
    filteredCategories.forEach(category => {
        if (!category.products || category.products.length === 0) return;
        
        html += `
            <div class="category-section">
                <div class="category-header">
                    <span class="category-icon">${category.icon}</span>
                    <h2 class="category-name">${category.name}</h2>
                    <span class="category-count">${category.products.length} товаров</span>
                </div>
                <div class="category-desc">${category.description}</div>
                
                <div class="products-grid">
        `;
        
        // Товары в категории
        category.products.forEach(product => {
            const monthsText = product.months === 'permanent' ? 'Навсегда' : 
                             product.months === '?' ? 'Не указано' : 
                             `${product.months} мес`;
            
            html += `
                <div class="product-card">
                    <div class="product-header">
                        <span class="product-number">${product.number}</span>
                        <span class="product-price">${product.price}</span>
                    </div>
                    <div class="product-description">${product.description || 'Без описания'}</div>
                    <div class="product-details">
                        <div class="detail-item">
                            <i class="fas fa-clock"></i>
                            <span>Отлет: ${monthsText}</span>
                        </div>
                        ${product.operator ? `
                        <div class="detail-item">
                            <i class="fas fa-sim-card"></i>
                            <span>${product.operator}</span>
                        </div>
                        ` : ''}
                    </div>
                    <div class="product-actions">
                        <button class="buy-btn" onclick="buyProduct('${product.number}', '${product.price}', '${category.name}')">
                            <i class="fas fa-shopping-cart"></i> Купить
                        </button>
                        <button class="details-btn" onclick="showProductDetails('${product.number}', '${product.price}', '${product.description || ''}', '${monthsText}', '${product.operator || ''}')">
                            <i class="fas fa-info-circle"></i> Подробнее
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    // Если ничего не отобразилось
    if (!html) {
        html = `
            <div class="no-products">
                <i class="fas fa-search"></i>
                <h3>В этой категории пока нет товаров</h3>
                <p>Выберите другую категорию или проверьте позже</p>
            </div>
        `;
    }
    
    container.innerHTML = html;
    
    // Обновляем время последнего обновления
    updateLastUpdateTime();
}

// Обновление времени последнего обновления
function updateLastUpdateTime() {
    const lastUpdateElement = document.getElementById('last-update');
    if (lastUpdateElement) {
        const now = new Date();
        lastUpdateElement.textContent = `Обновлено: ${now.toLocaleTimeString('ru-RU')}`;
    }
}

// Загрузка товаров
function loadProducts() {
    console.log('[SITE] Загрузка товаров...');
    
    try {
        // 1. Сначала из localStorage (свежие данные из админки)
        const localData = localStorage.getItem('iglova_shop_products');
        if (localData) {
            allProductsData = JSON.parse(localData);
            console.log('[SITE] Загружено из localStorage');
            displaySiteProducts(allProductsData);
            updateLastUpdateTime();
            return;
        }
        
        // 2. Если нет в localStorage - из файла
        fetch('products.json')
            .then(response => {
                if (!response.ok) throw new Error('Файл не найден');
                return response.json();
            })
            .then(data => {
                allProductsData = data;
                console.log('[SITE] Загружено из файла');
                displaySiteProducts(data);
                
                // Сохраняем в localStorage
                localStorage.setItem('iglova_shop_products', JSON.stringify(data));
                updateLastUpdateTime();
            })
            .catch(error => {
                console.error('[SITE] Ошибка загрузки:', error);
                showSiteNotification('⚠️ Ошибка загрузки товаров', 'error');
                
                // Показываем сообщение
                const container = document.getElementById('products-container');
                if (container) {
                    container.innerHTML = `
                        <div class="no-products">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h3>Нет подключения к данным</h3>
                            <p>Попробуйте обновить страницу (Ctrl+F5)</p>
                            <button onclick="forceRefreshProducts()" class="retry-btn">
                                <i class="fas fa-redo"></i> Повторить попытку
                            </button>
                            <p class="loading-subtext">Или используйте админ-панель для создания товаров</p>
                        </div>
                    `;
                }
            });
            
    } catch (error) {
        console.error('[SITE] Критическая ошибка:', error);
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    console.log('[SITE] IGLOV SHOP загружен');
    
    // Инициализация навигации
    initNavigation();
    
    // Инициализация фильтров
    initFilters();
    
    // Инициализация корзины
    initCart();
    
    // Анимация печатающегося текста
    initTypingAnimation();
    
    // Загружаем товары
    setTimeout(loadProducts, 100);
});

// Инициализация фильтров
function initFilters() {
    const filterButtons = document.querySelectorAll('.category-btn');
    if (filterButtons.length > 0) {
        filterButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const category = this.getAttribute('data-category');
                currentCategory = category;
                
                // Обновляем активную кнопку
                filterButtons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                // Обновляем товары
                if (allProductsData) {
                    displaySiteProducts(allProductsData);
                }
            });
        });
    }
}

// Анимация печатающегося текста
function initTypingAnimation() {
    const texts = [
        'connect_to_iglova_shop...',
        'loading_catalog...',
        'welcome_customer...',
        'telegram: @useriglov',
        'ready_to_buy...'
    ];
    
    const typingElement = document.getElementById('typing-text');
    if (!typingElement) return;
    
    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    
    function type() {
        const currentText = texts[textIndex];
        
        if (isDeleting) {
            // Удаление текста
            typingElement.textContent = currentText.substring(0, charIndex - 1);
            charIndex--;
            
            if (charIndex === 0) {
                isDeleting = false;
                textIndex = (textIndex + 1) % texts.length;
                setTimeout(type, 500);
            } else {
                setTimeout(type, 50);
            }
        } else {
            // Печать текста
            typingElement.textContent = currentText.substring(0, charIndex + 1);
            charIndex++;
            
            if (charIndex === currentText.length) {
                isDeleting = true;
                setTimeout(type, 2000);
            } else {
                setTimeout(type, 100);
            }
        }
    }
    
    // Запускаем анимацию
    setTimeout(type, 1000);
}

// Функции для покупки
function buyProduct(productName, price, category) {
    console.log(`Покупка товара: ${productName} - ${price}`);
    
    // Формируем сообщение для Telegram
    const message = encodeURIComponent(`Хочу купить товар:\n📱 ${productName}\n💰 ${price}\n📂 ${category}\n\nСвяжитесь со мной для оплаты.`);
    const telegramUrl = `https://t.me/useriglov?text=${message}`;
    
    // Открываем Telegram
    window.open(telegramUrl, '_blank');
    
    // Показываем уведомление
    showSiteNotification(`✅ Товар "${productName}" выбран. Открываем Telegram...`, 'success');
}

function showProductDetails(number, price, description, months, operator) {
    // Создаем модальное окно
    const modal = document.createElement('div');
    modal.className = 'product-modal-overlay';
    modal.innerHTML = `
        <div class="product-modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-mobile-alt"></i> ${number}</h3>
                <button class="modal-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="product-price-large">${price}</div>
                <div class="product-description-full">
                    <strong>Описание:</strong><br>
                    ${description || 'Описание отсутствует'}
                </div>
                <div class="product-details-grid">
                    <div class="detail-row">
                        <span><i class="fas fa-clock"></i> Срок отлета:</span>
                        <span class="detail-value">${months}</span>
                    </div>
                    ${operator ? `
                    <div class="detail-row">
                        <span><i class="fas fa-sim-card"></i> Оператор:</span>
                        <span class="detail-value">${operator}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
            <div class="modal-footer">
                <button class="buy-btn-large" onclick="buyProduct('${number}', '${price}', 'Детали'); this.parentElement.parentElement.parentElement.remove();">
                    <i class="fas fa-shopping-cart"></i> Купить этот товар
                </button>
                <button class="close-btn-large" onclick="this.parentElement.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i> Закрыть
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Открытие админ-панели
function openAdminPanel() {
    const password = prompt('🔐 Введите пароль администратора:');
    
    if (password === 'maybelaterfuck') {
        // Создаем окно админки
        const adminWindow = window.open('', '_blank', 'width=1200,height=700,scrollbars=yes');
        
        if (!adminWindow) {
            alert('Браузер заблокировал открытие окна. Разрешите всплывающие окна.');
            return;
        }
        
        // Загружаем админку из localStorage или создаем новую
        adminWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>IGLOV SHOP - Админ Панель</title>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
                <style>
                    body {
                        margin: 0;
                        padding: 0;
                        background: #000;
                        color: #0f0;
                        font-family: 'Courier New', monospace;
                        overflow: hidden;
                    }
                    .admin-container {
                        padding: 20px;
                    }
                    .admin-header {
                        border-bottom: 2px solid #0f0;
                        padding-bottom: 10px;
                        margin-bottom: 20px;
                    }
                    .admin-header h1 {
                        margin: 0;
                        color: #0f0;
                    }
                </style>
            </head>
            <body>
                <div class="admin-container">
                    <div class="admin-header">
                        <h1><i class="fas fa-user-shield"></i> IGLOV SHOP - Админ Панель</h1>
                        <p>Загружаем админ-панель...</p>
                    </div>
                    <p>Включите JavaScript или откройте admin.html напрямую.</p>
                    <p><a href="admin.html" target="_blank">Открыть полноценную админ-панель</a></p>
                </div>
                <script>
                    // Пробуем загрузить админку
                    try {
                        localStorage.setItem('admin_authenticated', 'true');
                        window.location.href = 'admin.html';
                    } catch(e) {
                        console.error('Ошибка:', e);
                    }
                </script>
            </body>
            </html>
        `);
        
    } else if (password !== null) {
        alert('❌ Неверный пароль!');
    }
}

// Инициализация корзины (базовая версия)
function initCart() {
    // Простая корзина
    console.log('[CART] Корзина инициализирована');
}

// Стили для уведомлений и модальных окон
const siteStyles = document.createElement('style');
siteStyles.textContent = `
    .site-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 30, 0, 0.95);
        border: 1px solid #00ff00;
        color: #0f0;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 15px;
        min-width: 250px;
        max-width: 350px;
        backdrop-filter: blur(10px);
        animation: slideIn 0.3s ease-out;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
        font-family: 'JetBrains Mono', monospace;
        font-size: 14px;
        border-left: 4px solid #00ff00;
    }
    
    .site-notification.error {
        background: rgba(50, 0, 0, 0.95);
        border-color: #ff3333;
        border-left-color: #ff3333;
    }
    
    .site-notification .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .site-notification button {
        background: none;
        border: none;
        color: #888;
        cursor: pointer;
        padding: 5px;
        opacity: 0.7;
    }
    
    .site-notification button:hover {
        opacity: 1;
        color: #ff9900;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .no-products {
        text-align: center;
        padding: 60px 20px;
        color: #888;
    }
    
    .no-products i {
        font-size: 3rem;
        margin-bottom: 20px;
        color: #ff9900;
    }
    
    .no-products h3 {
        color: #ff9900;
        margin-bottom: 10px;
    }
    
    .retry-btn {
        background: rgba(255, 153, 0, 0.2);
        border: 1px solid #ff9900;
        color: #ff9900;
        padding: 10px 20px;
        margin-top: 20px;
        cursor: pointer;
        border-radius: 5px;
        font-family: 'JetBrains Mono', monospace;
    }
    
    .retry-btn:hover {
        background: rgba(255, 153, 0, 0.3);
    }
    
    .loading-products {
        text-align: center;
        padding: 50px 20px;
        color: #888;
    }
    
    .loading-spinner {
        border: 4px solid rgba(0, 255, 0, 0.1);
        border-left: 4px solid #00ff00;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .status-loading, .status-success {
        padding: 8px 15px;
        border-radius: 5px;
        margin-top: 10px;
        font-size: 0.9rem;
    }
    
    .status-loading {
        background: rgba(0, 255, 0, 0.1);
        color: #00ff00;
        border: 1px solid rgba(0, 255, 0, 0.3);
    }
    
    .status-success {
        background: rgba(0, 255, 0, 0.2);
        color: #00ff00;
        border: 1px solid rgba(0, 255, 0, 0.5);
    }
    
    /* Стили для модального окна товара */
    .product-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(5px);
    }
    
    .product-modal-content {
        background: rgba(0, 20, 0, 0.95);
        border: 2px solid #00ff00;
        border-radius: 10px;
        padding: 25px;
        width: 90%;
        max-width: 500px;
        position: relative;
        box-shadow: 0 0 30px rgba(0, 255, 0, 0.3);
        font-family: 'JetBrains Mono', monospace;
    }
    
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid rgba(0, 255, 0, 0.3);
    }
    
    .modal-header h3 {
        color: #00ffff;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .modal-close {
        background: transparent;
        border: none;
        color: #888;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 5px;
    }
    
    .modal-close:hover {
        color: #ff3333;
    }
    
    .product-price-large {
        font-size: 2rem;
        color: #ff9900;
        font-weight: bold;
        margin-bottom: 15px;
        text-align: center;
    }
    
    .product-description-full {
        background: rgba(0, 40, 0, 0.3);
        border: 1px solid rgba(0, 255, 0, 0.2);
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 20px;
        line-height: 1.5;
    }
    
    .product-details-grid {
        display: grid;
        gap: 10px;
        margin-bottom: 25px;
    }
    
    .detail-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .detail-value {
        color: #00ff00;
        font-weight: bold;
    }
    
    .modal-footer {
        display: flex;
        gap: 10px;
    }
    
    .buy-btn-large, .close-btn-large {
        flex: 1;
        padding: 12px;
        border-radius: 5px;
        font-family: 'JetBrains Mono', monospace;
        cursor: pointer;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
    }
    
    .buy-btn-large {
        background: rgba(255, 153, 0, 0.2);
        border: 1px solid #ff9900;
        color: #ff9900;
    }
    
    .buy-btn-large:hover {
        background: rgba(255, 153, 0, 0.3);
    }
    
    .close-btn-large {
        background: rgba(255, 0, 0, 0.1);
        border: 1px solid #ff3333;
        color: #ff3333;
    }
    
    .close-btn-large:hover {
        background: rgba(255, 0, 0, 0.2);
    }
    
    /* Стили для товаров */
    .category-section {
        margin-bottom: 40px;
    }
    
    .category-header {
        display: flex;
        align-items: center;
        gap: 15px;
        margin-bottom: 10px;
        flex-wrap: wrap;
    }
    
    .category-icon {
        font-size: 1.5rem;
    }
    
    .category-name {
        color: #00ffff;
        margin: 0;
        font-size: 1.5rem;
    }
    
    .category-count {
        background: rgba(0, 255, 0, 0.2);
        color: #00ff00;
        padding: 3px 12px;
        border-radius: 12px;
        font-size: 0.9rem;
    }
    
    .category-desc {
        color: #888;
        margin-bottom: 20px;
        font-size: 0.95rem;
        font-style: italic;
    }
    
    .products-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
    }
    
    .product-card {
        background: rgba(0, 30, 0, 0.3);
        border: 1px solid rgba(0, 255, 0, 0.2);
        border-radius: 10px;
        padding: 20px;
        transition: all 0.3s;
    }
    
    .product-card:hover {
        border-color: #00ffff;
        transform: translateY(-5px);
        box-shadow: 0 10px 20px rgba(0, 255, 255, 0.2);
    }
    
    .product-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
    }
    
    .product-number {
        color: #00ffff;
        font-size: 1.2rem;
        font-weight: bold;
        font-family: 'Share Tech Mono', monospace;
    }
    
    .product-price {
        color: #ff9900;
        font-size: 1.3rem;
        font-weight: bold;
        font-family: 'Share Tech Mono', monospace;
    }
    
    .product-description {
        color: #ccc;
        margin-bottom: 15px;
        line-height: 1.4;
        font-size: 0.95rem;
    }
    
    .product-details {
        display: flex;
        gap: 15px;
        margin-bottom: 15px;
        flex-wrap: wrap;
    }
    
    .detail-item {
        display: flex;
        align-items: center;
        gap: 5px;
        color: #888;
        font-size: 0.9rem;
    }
    
    .product-actions {
        display: flex;
        gap: 10px;
    }
    
    .buy-btn, .details-btn {
        flex: 1;
        padding: 8px 15px;
        border-radius: 5px;
        font-family: 'JetBrains Mono', monospace;
        cursor: pointer;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        transition: all 0.2s;
    }
    
    .buy-btn {
        background: rgba(255, 153, 0, 0.2);
        border: 1px solid #ff9900;
        color: #ff9900;
    }
    
    .buy-btn:hover {
        background: rgba(255, 153, 0, 0.3);
    }
    
    .details-btn {
        background: rgba(0, 255, 255, 0.1);
        border: 1px solid #00ffff;
        color: #00ffff;
    }
    
    .details-btn:hover {
        background: rgba(0, 255, 255, 0.2);
    }
`;
document.head.appendChild(siteStyles);

console.log('[SITE] Скрипт загружен');
