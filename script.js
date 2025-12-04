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
            if (typeof displayProducts === 'function') {
                displayProducts(allProductsData);
            }
            
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

// Загрузка товаров
function loadProducts() {
    console.log('[SITE] Загрузка товаров...');
    
    try {
        // 1. Сначала из localStorage (свежие данные из админки)
        const localData = localStorage.getItem('iglova_shop_products');
        if (localData) {
            allProductsData = JSON.parse(localData);
            console.log('[SITE] Загружено из localStorage');
            displayProducts(allProductsData);
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
                displayProducts(data);
                
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
                if (allProductsData && typeof displayProducts === 'function') {
                    displayProducts(allProductsData);
                }
            });
        });
    }
}

// Инициализация корзины
function initCart() {
    // Ваш код корзины...
}

// Стили для уведомлений (добавить в CSS или в тег style)
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
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
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
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
`;
document.head.appendChild(notificationStyles);

console.log('[SITE] Скрипт загружен');
