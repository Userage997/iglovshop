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
        }
    };
} catch (e) {
    console.log('[SITE] Синхронизация недоступна');
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
            </div>
        `;
        return;
    }
    
    let html = '';
    
    // Если выбрана категория "all" - показываем все товары
    if (currentCategory === 'all') {
        // Показываем все категории
        productsData.categories.forEach(category => {
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
                            <button class="buy-btn" onclick="addToCart('${product.number}', '${product.price}', '${category.name}')">
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
    } else {
        // Показываем только выбранную категорию
        const category = productsData.categories.find(cat => cat.id === currentCategory);
        if (category && category.products && category.products.length > 0) {
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
                            <button class="buy-btn" onclick="addToCart('${product.number}', '${product.price}', '${category.name}')">
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
        } else {
            html = `
                <div class="no-products">
                    <i class="fas fa-search"></i>
                    <h3>В этой категории пока нет товаров</h3>
                    <p>Выберите другую категорию</p>
                </div>
            `;
        }
    }
    
    // Если ничего не отобразилось
    if (!html) {
        html = `
            <div class="no-products">
                <i class="fas fa-box-open"></i>
                <h3>Товаров пока нет</h3>
                <p>Администратор скоро добавит товары</p>
            </div>
        `;
    }
    
    container.innerHTML = html;
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
                            <button onclick="location.reload()" class="retry-btn">
                                <i class="fas fa-redo"></i> Обновить
                            </button>
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
    
    // Загружаем товары
    setTimeout(loadProducts, 100);
    
    // Инициализируем фильтры и корзину
    initFilters();
    initCart();
});

// Инициализация фильтров
function initFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
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

// Инициализация корзины
function initCart() {
    // Базовая инициализация корзины
    const cartBtn = document.querySelector('.cart-btn');
    if (cartBtn) {
        cartBtn.addEventListener('click', function() {
            alert('Корзина в разработке');
        });
    }
    
    // Инициализируем счетчик корзины
    updateCartCounter();
}

// Функции корзины (заглушки)
function addToCart(productName, price, category) {
    console.log(`Добавление в корзину: ${productName} - ${price}`);
    
    // Получаем текущую корзину
    let cart = JSON.parse(localStorage.getItem('iglova_cart')) || [];
    
    // Добавляем товар
    cart.push({
        name: productName,
        price: price,
        category: category,
        added: new Date().toISOString()
    });
    
    // Сохраняем
    localStorage.setItem('iglova_cart', JSON.stringify(cart));
    
    // Обновляем счетчик
    updateCartCounter();
    
    // Показываем уведомление
    showSiteNotification(`✅ ${productName} добавлен в корзину`, 'success');
}

function updateCartCounter() {
    const cartCounter = document.querySelector('.cart-counter');
    if (cartCounter) {
        const cart = JSON.parse(localStorage.getItem('iglova_cart')) || [];
        cartCounter.textContent = cart.length;
        cartCounter.style.display = cart.length > 0 ? 'flex' : 'none';
    }
}

function showProductDetails(number, price, description, months, operator) {
    // Создаем модальное окно
    const modal = document.createElement('div');
    modal.className = 'product-modal-overlay';
    modal.innerHTML = `
        <div class="product-modal-content">
            <div class="modal-header">
                <h3>${number}</h3>
                <button class="modal-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="product-price-large">${price}</div>
                <div class="product-description-full">
                    ${description || 'Описание отсутствует'}
                </div>
                <div class="product-details-grid">
                    <div class="detail-row">
                        <span><i class="fas fa-clock"></i> Отлет:</span>
                        <span>${months}</span>
                    </div>
                    ${operator ? `
                    <div class="detail-row">
                        <span><i class="fas fa-sim-card"></i> Оператор:</span>
                        <span>${operator}</span>
                    </div>
                    ` : ''}
                    <div class="detail-row">
                        <span><i class="fas fa-calendar"></i> Добавлен:</span>
                        <span>Сегодня</span>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="buy-btn-large" onclick="addToCart('${number}', '${price}', '${operator || 'Неизвестно'}'); this.parentElement.parentElement.remove();">
                    <i class="fas fa-shopping-cart"></i> Купить сейчас
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Стили для уведомлений и модальных окон
const siteStyles = document.createElement('style');
siteStyles.textContent = `
    .site-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 30, 0, 0.9);
        border: 1px solid #00ff00;
        color: white;
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
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        font-family: 'JetBrains Mono', monospace;
        font-size: 14px;
    }
    
    .site-notification.success {
        border-left: 4px solid #00ff00;
        background: rgba(0, 50, 0, 0.9);
    }
    
    .site-notification.error {
        border-left: 4px solid #ff3333;
        background: rgba(50, 0, 0, 0.9);
        border-color: #ff3333;
    }
    
    .site-notification .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .site-notification button {
        background: none;
        border: none;
        color: white;
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
    
    /* Стили для модального окна товара */
    .product-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(5px);
    }
    
    .product-modal-content {
        background: rgba(0, 20, 0, 0.95);
        border: 2px solid #00ff00;
        border-radius: 12px;
        padding: 30px;
        width: 90%;
        max-width: 500px;
        position: relative;
        box-shadow: 0 0 50px rgba(0, 255, 0, 0.3);
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
    
    .detail-row:last-child {
        border-bottom: none;
    }
    
    .buy-btn-large {
        width: 100%;
        padding: 15px;
        background: linear-gradient(45deg, #ff9900, #ff6600);
        border: none;
        color: white;
        border-radius: 8px;
        font-size: 1.1rem;
        font-weight: bold;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
    }
    
    .buy-btn-large:hover {
        background: linear-gradient(45deg, #ff6600, #ff9900);
    }
    
    .category-section {
        margin-bottom: 40px;
    }
    
    .category-header {
        display: flex;
        align-items: center;
        gap: 15px;
        margin-bottom: 10px;
    }
    
    .category-icon {
        font-size: 1.5rem;
    }
    
    .category-name {
        color: #00ffff;
        margin: 0;
    }
    
    .category-count {
        background: rgba(0, 255, 0, 0.2);
        color: #00ff00;
        padding: 2px 10px;
        border-radius: 10px;
        font-size: 0.9rem;
    }
    
    .category-desc {
        color: #888;
        margin-bottom: 20px;
        font-size: 0.95rem;
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
    }
    
    .product-price {
        color: #ff9900;
        font-size: 1.3rem;
        font-weight: bold;
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
    
    /* Стили для корзины */
    .cart-counter {
        position: absolute;
        top: -5px;
        right: -5px;
        background: #ff3333;
        color: white;
        font-size: 0.8rem;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        display: none;
    }
`;
document.head.appendChild(siteStyles);

console.log('[SITE] Скрипт загружен');
