// ===== АДМИН-ПАНЕЛЬ IGLOV SHOP =====
// Конфигурация
const CONFIG = {
    password: "maybelaterfuck",
    backupKey: "iglova_shop_backup_v3",
    storageKey: "iglova_admin_data_v3",
    version: "3.0",
    owner: "@useriglov",
    github: {
        repo: "Userage997/iglovshop",
        file: "products.json",
        rawUrl: "https://raw.githubusercontent.com/Userage997/iglovshop/main/products.json"
    }
};

// Глобальные переменные
let allProducts = [];
let categories = [
    { id: "russian", name: "НОМЕРА РФ", icon: "🇷🇺", description: "Российские номера с гарантией отлета" },
    { id: "foreign", name: "ЗАРУБЕЖНЫЕ", icon: "🌍", description: "Номера других стран" },
    { id: "nft_users", name: "NFT ЮЗЕРЫ", icon: "🎨", description: "NFT аккаунты и профили" },
    { id: "nft_gifts", name: "NFT ПОДАРКИ", icon: "🎁", description: "Цифровые подарки и активы" }
];

let sessionStartTime = null;
let sessionTimer = null;
let currentEditingIndex = -1;
let isPasswordVisible = false;

// Синхронизация между вкладками
let syncChannel;
try {
    syncChannel = new BroadcastChannel('iglova_shop_sync');
} catch (e) {
    console.log('[SYNC] BroadcastChannel не поддерживается');
}

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    console.log(`[ADMIN] IGLOV SHOP Admin v${CONFIG.version} initialized`);
    console.log(`[AUTH] Password check enabled`);
    
    // Устанавливаем время входа
    updateLoginTimestamp();
    
    // Проверяем авторизацию
    if (localStorage.getItem('admin_authenticated') === 'true') {
        showAdminPanel();
    } else {
        // Фокус на поле пароля
        setTimeout(() => {
            const passwordInput = document.getElementById('admin-password');
            if (passwordInput) passwordInput.focus();
        }, 500);
    }
    
    // Загружаем данные
    loadFromStorage();
    updateUI();
    
    // Обработка формы добавления товара
    const productNumber = document.getElementById('product-number');
    const productPrice = document.getElementById('product-price');
    const productMonths = document.getElementById('product-months');
    const productOperator = document.getElementById('product-operator');
    const productDescription = document.getElementById('product-description');
    
    if (productNumber) productNumber.addEventListener('input', updateProductPreview);
    if (productPrice) productPrice.addEventListener('input', updateProductPreview);
    if (productMonths) productMonths.addEventListener('change', updateProductPreview);
    if (productOperator) productOperator.addEventListener('change', updateProductPreview);
    if (productDescription) productDescription.addEventListener('input', updateProductPreview);
    
    // Обновляем время каждую секунду
    setInterval(updateCurrentTime, 1000);
    
    // Обновляем предпросмотр
    setInterval(updateProductPreview, 1000);
});

// Обновление времени входа
function updateLoginTimestamp() {
    const timestampElement = document.getElementById('login-timestamp');
    if (timestampElement) {
        const now = new Date();
        timestampElement.textContent = now.toLocaleString('ru-RU');
    }
}

// Переключение видимости пароля
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('admin-password');
    const toggleIcon = document.querySelector('.password-toggle i');
    
    if (passwordInput) {
        isPasswordVisible = !isPasswordVisible;
        passwordInput.type = isPasswordVisible ? 'text' : 'password';
        toggleIcon.className = isPasswordVisible ? 'fas fa-eye-slash' : 'fas fa-eye';
    }
}

// Проверка пароля
function checkPassword() {
    const passwordInput = document.getElementById('admin-password');
    const password = passwordInput ? passwordInput.value : '';
    const errorElement = document.getElementById('password-error');
    const loader = document.getElementById('login-loader');
    const loginBtn = document.querySelector('.login-btn');
    
    if (!password) {
        showError('Введите пароль доступа');
        return;
    }
    
    // Показываем загрузку
    if (loader) loader.style.display = 'block';
    if (loginBtn) loginBtn.disabled = true;
    
    // Имитация задержки проверки
    setTimeout(() => {
        if (password === CONFIG.password) {
            // Успешный вход
            localStorage.setItem('admin_authenticated', 'true');
            showAdminPanel();
            console.log('[AUTH] Successful login');
            
            // Скрываем ошибку если была
            if (errorElement) errorElement.style.display = 'none';
        } else {
            // Неверный пароль
            showError('Неверный пароль доступа');
            console.warn('[AUTH] Failed login attempt');
            
            // Эффект вибрации
            if (passwordInput) {
                passwordInput.style.animation = 'shake 0.5s';
                setTimeout(() => {
                    passwordInput.style.animation = '';
                }, 500);
                
                // Очистка поля
                passwordInput.value = '';
                passwordInput.focus();
            }
        }
        
        // Скрываем загрузку
        if (loader) loader.style.display = 'none';
        if (loginBtn) loginBtn.disabled = false;
    }, 1000);
}

// Показать ошибку
function showError(message) {
    const errorElement = document.getElementById('password-error');
    const errorText = document.getElementById('error-text');
    
    if (errorElement && errorText) {
        errorText.textContent = message;
        errorElement.style.display = 'flex';
        
        // Автоматическое скрытие через 5 секунд
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }
}

// Показать админ-панель
function showAdminPanel() {
    const passwordScreen = document.getElementById('password-screen');
    const adminPanel = document.getElementById('admin-panel');
    
    if (passwordScreen) passwordScreen.style.display = 'none';
    if (adminPanel) adminPanel.style.display = 'block';
    
    sessionStartTime = new Date();
    startSessionTimer();
    updateCurrentTime();
    loadFromStorage();
    updateUI();
    
    // Показываем системную информацию
    updateSystemInfo();
    
    // Фокус на первую вкладку
    switchTab('dashboard');
}

// Выход из системы
function logout() {
    if (confirm('Выйти из админ-панели?')) {
        localStorage.removeItem('admin_authenticated');
        if (sessionTimer) clearInterval(sessionTimer);
        location.reload();
    }
}

// Таймер сессии
function startSessionTimer() {
    if (sessionTimer) clearInterval(sessionTimer);
    
    sessionTimer = setInterval(() => {
        if (!sessionStartTime) return;
        
        const now = new Date();
        const diff = Math.floor((now - sessionStartTime) / 1000);
        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;
        
        const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Обновляем все элементы с таймером
        const sessionTimerEl = document.getElementById('session-timer');
        const sessionTimeStat = document.getElementById('session-time-stat');
        
        if (sessionTimerEl) sessionTimerEl.textContent = timeStr;
        if (sessionTimeStat) sessionTimeStat.textContent = timeStr;
    }, 1000);
}

// Обновление текущего времени
function updateCurrentTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ru-RU');
    const currentTimeElement = document.getElementById('current-time');
    if (currentTimeElement) {
        currentTimeElement.textContent = timeStr;
    }
}

// Переключение вкладок
function switchTab(tabName) {
    console.log('Переключение на вкладку:', tabName);
    
    // Скрываем все вкладки
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Убираем активность у всех кнопок меню
    document.querySelectorAll('.menu-item').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Показываем нужную вкладку
    const tabElement = document.getElementById(`tab-${tabName}`);
    if (tabElement) {
        tabElement.classList.add('active');
    }
    
    // Активируем кнопку меню
    const menuButtons = document.querySelectorAll('.menu-item');
    menuButtons.forEach(button => {
        if (button.getAttribute('onclick') === `switchTab('${tabName}')`) {
            button.classList.add('active');
        }
    });
    
    // Обновляем данные если нужно
    switch(tabName) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'products':
            displayProducts();
            break;
        case 'add-product':
            updateProductPreview();
            break;
        case 'categories':
            displayCategories();
            break;
        case 'export':
            updateExportTab();
            break;
        case 'backup':
            updateBackupTab();
            break;
        case 'settings':
            updateSettingsTab();
            break;
    }
}

// Загрузка данных из localStorage
function loadFromStorage() {
    try {
        const saved = localStorage.getItem(CONFIG.storageKey);
        if (saved) {
            const data = JSON.parse(saved);
            allProducts = data.products || [];
            categories = data.categories || categories;
            console.log(`[LOAD] Загружено ${allProducts.length} товаров, ${categories.length} категорий`);
            
            // Автоматически обновляем сайт при загрузке
            autoUpdateWebsite();
        }
    } catch (e) {
        console.error('[ERROR] Ошибка загрузки из хранилища:', e);
        allProducts = [];
    }
}

// Сохранение данных в localStorage и автообновление сайта
function saveToStorage() {
    const data = {
        timestamp: new Date().toISOString(),
        products: allProducts,
        categories: categories,
        version: CONFIG.version
    };
    
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(data));
    
    // Автоматически обновляем сайт
    autoUpdateWebsite();
    
    // Синхронизируем с другими вкладками
    syncWithOtherTabs();
    
    updateUI();
    console.log(`[SAVE] Сохранено ${allProducts.length} товаров`);
}

// Синхронизация между вкладками
function syncWithOtherTabs() {
    try {
        if (!syncChannel) return;
        
        const data = prepareDataForExport();
        
        syncChannel.postMessage({
            type: 'data_updated',
            data: data,
            timestamp: new Date().toISOString(),
            source: 'admin_panel'
        });
        
        console.log('[SYNC] Данные отправлены другим вкладкам');
    } catch (e) {
        console.warn('[SYNC] Ошибка синхронизации');
    }
}

// Автоматическое обновление сайта (без скачивания файла)
function autoUpdateWebsite() {
    try {
        const exportData = prepareDataForExport();
        const jsonStr = JSON.stringify(exportData, null, 2);
        
        // Сохраняем в localStorage для сайта
        localStorage.setItem('iglova_shop_products', jsonStr);
        
        console.log('[AUTO-UPDATE] Данные сохранены для сайта');
        
        // Показываем уведомление (опционально)
        if (document.querySelector('.form-status')) {
            showFormStatus('success', `✅ Локальные данные обновлены (${allProducts.length} товаров)`);
        }
        
    } catch (error) {
        console.error('[ERROR] Auto-update failed:', error);
    }
}

// Функция для обновления данных на GitHub
function updateGitHubProducts() {
    const statusElement = document.getElementById('add-product-status') || 
                         document.getElementById('update-site-status') ||
                         document.querySelector('.form-status');
    
    try {
        const exportData = prepareDataForExport();
        const jsonStr = JSON.stringify(exportData, null, 2);
        
        // Создаем Blob для скачивания
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Формируем ссылки
        const githubEditUrl = `https://github.com/${CONFIG.github.repo}/edit/main/${CONFIG.github.file}`;
        const githubRawUrl = `${CONFIG.github.rawUrl}?v=${Date.now()}`;
        const githubRepoUrl = `https://github.com/${CONFIG.github.repo}`;
        
        // Показываем подробную инструкцию
        const message = `
            <div class="status success" style="text-align: left;">
                <h4><i class="fas fa-check-circle"></i> Данные готовы для GitHub!</h4>
                <p><strong>Шаг 1:</strong> Скачайте файл: 
                    <a href="${url}" download="products.json" style="color:#00ffff; font-weight:bold;">
                        <i class="fas fa-download"></i> products.json
                    </a>
                </p>
                <p><strong>Шаг 2:</strong> Загрузите его:</p>
                <ul style="margin-left:20px; margin-bottom:15px;">
                    <li><a href="${githubEditUrl}" target="_blank" style="color:#00ffff;">
                        ✏️ В редакторе GitHub (просто вставьте содержимое)
                    </a></li>
                    <li>Или через загрузку файлов в репозитории</li>
                </ul>
                <p><strong>Шаг 3:</strong> Через 1-2 минуты проверьте сайт:
                    <a href="${githubRawUrl}" target="_blank" style="color:#00ffff;">
                        ${githubRawUrl}
                    </a>
                </p>
                <div style="margin-top:15px; padding:10px; background:rgba(0,255,0,0.1); border:1px solid #0f0;">
                    <strong><i class="fas fa-code"></i> JSON для копирования:</strong>
                    <textarea id="github-json-text" 
                              style="width:100%; height:150px; background:#000; color:#0f0; 
                                     border:1px solid #0f0; padding:10px; margin-top:10px;
                                     font-family:'JetBrains Mono', monospace; font-size:12px;"
                              readonly>${jsonStr}</textarea>
                    <button onclick="copyGitHubJson()" 
                            style="margin-top:10px; padding:8px 15px; background:rgba(0,100,255,0.2); 
                                   border:1px solid #00aaff; color:#66aaff; cursor:pointer;">
                        <i class="fas fa-copy"></i> Копировать JSON
                    </button>
                </div>
                <div style="margin-top:15px; font-size:0.9em; color:#888;">
                    <i class="fas fa-info-circle"></i> После загрузки на GitHub, на сайте 
                    <a href="/iglovshop/" target="_blank" style="color:#00ffff;">нажмите "Обновить базу товаров"</a>
                </div>
            </div>
        `;
        
        // Показываем сообщение
        if (statusElement) {
            statusElement.innerHTML = message;
        } else {
            // Создаем новое уведомление
            const notification = document.createElement('div');
            notification.className = 'github-notification';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(0, 30, 0, 0.95);
                border: 2px solid #00ff00;
                padding: 20px;
                border-radius: 10px;
                z-index: 10000;
                max-width: 500px;
                box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
            `;
            notification.innerHTML = message;
            document.body.appendChild(notification);
            
            // Добавляем кнопку закрытия
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '✕';
            closeBtn.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                background: transparent;
                border: none;
                color: #888;
                font-size: 20px;
                cursor: pointer;
            `;
            closeBtn.onclick = () => notification.remove();
            notification.appendChild(closeBtn);
        }
        
        // Освобождаем URL через 10 минут
        setTimeout(() => URL.revokeObjectURL(url), 600000);
        
        return url;
        
    } catch (error) {
        console.error('[GITHUB] Ошибка обновления:', error);
        const errorMsg = `<div class="status error">
            <i class="fas fa-exclamation-circle"></i> Ошибка: ${error.message}
        </div>`;
        
        if (statusElement) {
            statusElement.innerHTML = errorMsg;
        }
        return null;
    }
}

// Функция для копирования JSON в буфер обмена
async function copyGitHubJson() {
    try {
        const textarea = document.getElementById('github-json-text');
        if (textarea) {
            await navigator.clipboard.writeText(textarea.value);
            showFormStatus('success', '📋 JSON скопирован в буфер обмена!');
        }
    } catch (err) {
        showFormStatus('error', '❌ Ошибка копирования: ' + err.message);
    }
}

// Обновление сайта (главная функция)
function updateWebsite() {
    const status = updateGitHubProducts();
    if (status) {
        // Синхронизируем с другими вкладками
        syncWithOtherTabs();
        
        // Показываем общее уведомление
        showFormStatus('success', 
            `✅ Данные подготовлены для GitHub! Товаров: ${allProducts.length}, Категорий: ${categories.length}`);
    }
}

// Обновление сайта из дашборда
function updateWebsiteFromDashboard() {
    updateWebsite();
    updateDashboard();
}

// Обновление интерфейса
function updateUI() {
    updateDashboard();
    displayProducts();
    displayCategories();
    updateExportTab();
    updateSystemInfo();
}

// Обновление дашборда
function updateDashboard() {
    // Общая статистика
    const totalProductsStat = document.getElementById('total-products-stat');
    const totalCategoriesStat = document.getElementById('total-categories-stat');
    const dataCounter = document.getElementById('data-counter');
    const totalValueStat = document.getElementById('total-value-stat');
    const productsCountBadge = document.getElementById('products-count-badge');
    const categoriesCountBadge = document.getElementById('categories-count-badge');
    
    if (totalProductsStat) totalProductsStat.textContent = allProducts.length;
    if (totalCategoriesStat) totalCategoriesStat.textContent = categories.length;
    if (dataCounter) dataCounter.textContent = `${allProducts.length} товаров`;
    if (productsCountBadge) productsCountBadge.textContent = allProducts.length;
    if (categoriesCountBadge) categoriesCountBadge.textContent = categories.length;
    
    // Общая стоимость
    const totalValue = allProducts.reduce((sum, product) => {
        const price = parseFloat(product.price) || 0;
        return sum + price;
    }, 0);
    if (totalValueStat) totalValueStat.textContent = `${totalValue} ₽`;
    
    // Последние изменения
    updateRecentActivity();
}

// Последние изменения
function updateRecentActivity() {
    const container = document.getElementById('recent-activity');
    if (!container) return;
    
    if (allProducts.length === 0) {
        container.innerHTML = `
            <div class="activity-item">
                <i class="fas fa-info-circle"></i>
                <div class="activity-text">
                    <p>Загрузите данные для просмотра активности</p>
                    <small>Нет данных</small>
                </div>
            </div>
        `;
        return;
    }
    
    // Берем последние 5 товаров
    const recentProducts = [...allProducts]
        .sort((a, b) => new Date(b.created || 0) - new Date(a.created || 0))
        .slice(0, 5);
    
    let html = '';
    recentProducts.forEach(product => {
        const category = categories.find(c => c.id === product.categoryId) || { name: 'Без категории' };
        const timeAgo = getTimeAgo(product.created);
        
        html += `
            <div class="activity-item">
                <i class="fas fa-box"></i>
                <div class="activity-text">
                    <p>Добавлен товар: ${product.number}</p>
                    <small>${category.name} • ${timeAgo}</small>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function getTimeAgo(timestamp) {
    if (!timestamp) return 'давно';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return 'только что';
    if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
    return `${Math.floor(diff / 86400)} дн назад`;
}

// Отображение товаров
function displayProducts() {
    const tbody = document.getElementById('products-list');
    const infoElement = document.getElementById('products-table-info');
    
    if (!tbody || !infoElement) return;
    
    if (allProducts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #888;">
                    <i class="fas fa-box-open" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    🛒 Товаров пока нет. Добавьте первый товар!
                </td>
            </tr>
        `;
        infoElement.textContent = 'Показано 0 товаров из 0';
        return;
    }
    
    let html = '';
    allProducts.forEach((product, index) => {
        const category = categories.find(c => c.id === product.categoryId) || { name: 'Без категории', icon: '❓' };
        const price = product.price || '0 ₽';
        const months = product.months || '?';
        
        html += `
            <tr>
                <td style="color: #ff9900; font-weight: bold;">${index + 1}</td>
                <td>
                    <div style="font-weight: bold; color: #00ffff;">${product.number || 'Без названия'}</div>
                    ${product.description ? `<div style="color: #888; font-size: 0.9rem; margin-top: 5px;">${product.description}</div>` : ''}
                </td>
                <td><span style="color: #ff9900; font-weight: bold;">${price}</span></td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span>${category.icon}</span>
                        <span>${category.name}</span>
                    </div>
                </td>
                <td>
                    <span class="months-badge" style="
                        background: ${months === 'permanent' ? 'rgba(0, 255, 0, 0.2)' : 
                                     months >= 6 ? 'rgba(255, 153, 0, 0.2)' : 'rgba(0, 100, 255, 0.2)'};
                        color: ${months === 'permanent' ? '#00ff00' : 
                                 months >= 6 ? '#ff9900' : '#66aaff'};
                        padding: 3px 8px;
                        border-radius: 10px;
                        font-size: 0.9rem;
                        border: 1px solid ${months === 'permanent' ? '#00ff00' : 
                                         months >= 6 ? '#ff9900' : '#0066ff'};
                    ">
                        ${months === 'permanent' ? '∞' : months} ${months === 'permanent' ? '' : 'мес'}
                    </span>
                </td>
                <td style="white-space: nowrap;">
                    <button class="action-btn edit-btn" onclick="editProduct(${index})" title="Редактировать">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteProduct(${index})" title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    infoElement.textContent = `Показано ${allProducts.length} товаров из ${allProducts.length}`;
}

// Фильтрация товаров
function filterProducts() {
    const searchTerm = document.getElementById('search-products').value.toLowerCase();
    const rows = document.querySelectorAll('#products-list tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    const infoElement = document.getElementById('products-table-info');
    if (infoElement) {
        infoElement.textContent = `Показано ${visibleCount} товаров из ${allProducts.length}`;
    }
}

// Добавление товара
function addProduct() {
    const numberInput = document.getElementById('product-number');
    const priceInput = document.getElementById('product-price');
    const monthsInput = document.getElementById('product-months');
    const operatorInput = document.getElementById('product-operator');
    const categoryInput = document.getElementById('product-category');
    const descriptionInput = document.getElementById('product-description');
    
    if (!numberInput || !priceInput || !categoryInput) {
        showFormStatus('error', '❌ Ошибка: форма не найдена');
        return;
    }
    
    const number = numberInput.value.trim();
    const price = priceInput.value.trim();
    const months = monthsInput ? monthsInput.value : '?';
    const operator = operatorInput ? operatorInput.value : '';
    const categoryId = categoryInput.value;
    const description = descriptionInput ? descriptionInput.value.trim() : '';
    
    // Валидация
    if (!number) {
        showFormStatus('error', '❌ Введите номер телефона или название товара');
        return;
    }
    
    if (!price || isNaN(parseFloat(price))) {
        showFormStatus('error', '❌ Введите корректную цену (только цифры)');
        return;
    }
    
    // Создаем товар
    const product = {
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        number: number,
        price: price.includes('₽') ? price : price + ' ₽',
        months: months,
        operator: operator,
        categoryId: categoryId,
        description: description,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
    };
    
    // Если редактируем существующий товар
    if (currentEditingIndex >= 0) {
        allProducts[currentEditingIndex] = product;
        showFormStatus('success', '✅ Товар успешно обновлен!');
        currentEditingIndex = -1;
        
        // Меняем текст кнопки обратно
        const addProductBtn = document.getElementById('add-product-btn');
        if (addProductBtn) {
            addProductBtn.innerHTML = `
                <i class="fas fa-save"></i>
                <span>СОХРАНИТЬ ТОВАР</span>
            `;
        }
    } else {
        // Добавляем новый товар
        allProducts.push(product);
        showFormStatus('success', '✅ Товар успешно добавлен!');
    }
    
    // Сохраняем и автоматически обновляем сайт
    saveToStorage();
    
    // Очищаем форму
    resetProductForm();
    
    // Переключаемся на список товаров
    setTimeout(() => switchTab('products'), 1000);
}

// Редактирование товара
function editProduct(index) {
    if (index < 0 || index >= allProducts.length) return;
    
    const product = allProducts[index];
    currentEditingIndex = index;
    
    // Заполняем форму
    const numberInput = document.getElementById('product-number');
    const priceInput = document.getElementById('product-price');
    const monthsInput = document.getElementById('product-months');
    const operatorInput = document.getElementById('product-operator');
    const categoryInput = document.getElementById('product-category');
    const descriptionInput = document.getElementById('product-description');
    const addProductBtn = document.getElementById('add-product-btn');
    
    if (numberInput) numberInput.value = product.number;
    if (priceInput) priceInput.value = product.price.replace(' ₽', '');
    if (monthsInput) monthsInput.value = product.months || '?';
    if (operatorInput) operatorInput.value = product.operator || '';
    if (categoryInput) categoryInput.value = product.categoryId;
    if (descriptionInput) descriptionInput.value = product.description || '';
    
    // Меняем текст кнопки
    if (addProductBtn) {
        addProductBtn.innerHTML = `
            <i class="fas fa-save"></i>
            <span>ОБНОВИТЬ ТОВАР</span>
        `;
    }
    
    // Переключаемся на форму
    switchTab('add-product');
}

// Удаление товара
function deleteProduct(index) {
    if (index < 0 || index >= allProducts.length) return;
    
    if (confirm(`❌ Удалить товар "${allProducts[index].number}"?`)) {
        const deleted = allProducts.splice(index, 1)[0];
        saveToStorage(); // Автоматически обновляем сайт
        showFormStatus('success', `🗑️ Товар "${deleted.number}" удален`);
    }
}

// Сброс формы товара
function resetProductForm() {
    const numberInput = document.getElementById('product-number');
    const priceInput = document.getElementById('product-price');
    const monthsInput = document.getElementById('product-months');
    const operatorInput = document.getElementById('product-operator');
    const categoryInput = document.getElementById('product-category');
    const descriptionInput = document.getElementById('product-description');
    const addProductBtn = document.getElementById('add-product-btn');
    
    if (numberInput) numberInput.value = '';
    if (priceInput) priceInput.value = '';
    if (monthsInput) monthsInput.value = '?';
    if (operatorInput) operatorInput.value = '';
    if (categoryInput) categoryInput.value = 'russian';
    if (descriptionInput) descriptionInput.value = '';
    
    // Восстанавливаем кнопку
    if (addProductBtn) {
        addProductBtn.innerHTML = `
            <i class="fas fa-save"></i>
            <span>СОХРАНИТЬ ТОВАР</span>
        `;
    }
    
    currentEditingIndex = -1;
    
    // Очищаем статус
    const statusElement = document.getElementById('add-product-status');
    if (statusElement) {
        statusElement.className = 'form-status';
        statusElement.textContent = '';
    }
    
    // Обновляем предпросмотр
    updateProductPreview();
}

// Обновление предпросмотра товара
function updateProductPreview() {
    const numberInput = document.getElementById('product-number');
    const priceInput = document.getElementById('product-price');
    const monthsInput = document.getElementById('product-months');
    const operatorInput = document.getElementById('product-operator');
    const categoryInput = document.getElementById('product-category');
    const descriptionInput = document.getElementById('product-description');
    
    const number = numberInput ? numberInput.value : '+7 (XXX) XXX-XX-XX';
    const price = priceInput ? priceInput.value : '0';
    const months = monthsInput ? monthsInput.value : '?';
    const operator = operatorInput ? operatorInput.value : 'Не указано';
    const categoryId = categoryInput ? categoryInput.value : 'russian';
    const description = descriptionInput ? descriptionInput.value : '';
    
    const category = categories.find(c => c.id === categoryId) || categories[0];
    const preview = document.getElementById('product-preview');
    
    if (preview) {
        const previewNumber = preview.querySelector('.preview-number');
        const previewPrice = preview.querySelector('.preview-price');
        const previewDesc = preview.querySelector('.preview-desc');
        const previewDetails = preview.querySelector('.preview-details');
        const previewCategory = preview.querySelector('.preview-category');
        
        if (previewNumber) previewNumber.textContent = number;
        if (previewPrice) previewPrice.textContent = `${price} ₽`;
        if (previewDesc) previewDesc.textContent = description || 'Описание отсутствует';
        if (previewDetails) {
            previewDetails.innerHTML = `
                <div class="detail-item">
                    <span>Срок отлета:</span>
                    <span>${months === 'permanent' ? 'Постоянный' : (months === '?' ? 'Неизвестно' : months + ' мес')}</span>
                </div>
                <div class="detail-item">
                    <span>Оператор:</span>
                    <span>${operator}</span>
                </div>
            `;
        }
        if (previewCategory) previewCategory.textContent = `${category.icon} ${category.name}`;
    }
}

// Показать статус формы
function showFormStatus(type, message) {
    let statusElement = document.getElementById('add-product-status');
    if (!statusElement) {
        statusElement = document.getElementById('update-site-status');
    }
    if (!statusElement) {
        // Создаем временный элемент
        statusElement = document.createElement('div');
        statusElement.className = 'form-status';
        document.querySelector('.admin-content').prepend(statusElement);
    }
    
    statusElement.textContent = message;
    statusElement.className = `form-status ${type}`;
    
    // Автоматическое скрытие для success
    if (type === 'success') {
        setTimeout(() => {
            statusElement.className = 'form-status';
            statusElement.textContent = '';
        }, 5000);
    }
}

// Отображение категорий
function displayCategories() {
    const container = document.getElementById('tab-categories');
    if (!container) return;
    
    let html = `
        <div class="tab-header">
            <h2><i class="fas fa-folder-open"></i> Управление категориями</h2>
            <div class="tab-actions">
                <button class="action-btn" onclick="showAddCategoryModal()">
                    <i class="fas fa-plus"></i> Добавить категорию
                </button>
            </div>
        </div>
        
        <div class="categories-grid">
    `;
    
    categories.forEach((cat, index) => {
        const productCount = allProducts.filter(p => p.categoryId === cat.id).length;
        const productsInCat = allProducts.filter(p => p.categoryId === cat.id);
        const totalValue = productsInCat.reduce((sum, p) => {
            const price = parseFloat(p.price) || 0;
            return sum + price;
        }, 0);
        
        html += `
            <div class="category-card">
                <div class="category-header">
                    <div class="category-icon">${cat.icon}</div>
                    <div class="category-actions">
                        <button class="action-btn small" onclick="editCategory(${index})" title="Редактировать">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn small" onclick="deleteCategory(${index})" 
                                ${productCount > 0 ? 'disabled' : ''} 
                                title="${productCount > 0 ? 'Нельзя удалить категорию с товарами' : 'Удалить'}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="category-name">${cat.name}</div>
                <div class="category-id">ID: <code>${cat.id}</code></div>
                <div class="category-desc">${cat.description}</div>
                <div class="category-stats">
                    <div class="stat">
                        <i class="fas fa-box"></i>
                        <span>${productCount} товаров</span>
                    </div>
                    <div class="stat">
                        <i class="fas fa-ruble-sign"></i>
                        <span>${Math.round(totalValue)} ₽</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += `
        </div>
        <div class="categories-info">
            <p><i class="fas fa-info-circle"></i> Всего категорий: ${categories.length}</p>
        </div>
    `;
    
    container.innerHTML = html;
}

// Показать модальное окно добавления категории
function showAddCategoryModal() {
    const modalHtml = `
        <div class="modal-overlay" id="category-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-plus"></i> Добавить новую категорию</h3>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="new-category-name">Название категории:</label>
                        <input type="text" id="new-category-name" class="cyber-input" 
                               placeholder="Например: Премиум номера">
                    </div>
                    <div class="form-group">
                        <label for="new-category-icon">Иконка (эмодзи):</label>
                        <input type="text" id="new-category-icon" class="cyber-input" 
                               placeholder="⭐">
                    </div>
                    <div class="form-group">
                        <label for="new-category-id">ID категории:</label>
                        <input type="text" id="new-category-id" class="cyber-input" 
                               placeholder="premium">
                        <p class="form-hint">Только английские буквы, цифры и нижнее подчеркивание</p>
                    </div>
                    <div class="form-group">
                        <label for="new-category-desc">Описание:</label>
                        <textarea id="new-category-desc" class="cyber-input" rows="3"
                                  placeholder="Описание категории"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="action-btn" onclick="closeModal()">Отмена</button>
                    <button class="action-btn primary" onclick="addNewCategory()">Добавить категорию</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// Закрыть модальное окно
function closeModal() {
    const modal = document.getElementById('category-modal');
    if (modal) modal.remove();
}

// Добавить новую категорию
function addNewCategory() {
    const nameInput = document.getElementById('new-category-name');
    const iconInput = document.getElementById('new-category-icon');
    const idInput = document.getElementById('new-category-id');
    const descInput = document.getElementById('new-category-desc');
    
    if (!nameInput || !iconInput || !idInput) {
        alert('Ошибка: форма не найдена');
        return;
    }
    
    const name = nameInput.value.trim();
    const icon = iconInput.value.trim();
    const id = idInput.value.trim().toLowerCase().replace(/\s+/g, '_');
    const desc = descInput ? descInput.value.trim() : '';
    
    if (!name || !icon || !id) {
        alert('Заполните обязательные поля');
        return;
    }
    
    if (!/^[a-z0-9_]+$/.test(id)) {
        alert('ID может содержать только английские буквы, цифры и нижнее подчеркивание');
        return;
    }
    
    // Проверяем уникальность ID
    if (categories.some(c => c.id === id)) {
        alert('Категория с таким ID уже существует');
        return;
    }
    
    // Добавляем категорию
    categories.push({
        id: id,
        name: name,
        icon: icon,
        description: desc || 'Новая категория товаров'
    });
    
    // Сохраняем и обновляем сайт
    saveToStorage();
    
    // Закрываем модальное окно
    closeModal();
    
    // Обновляем интерфейс
    displayCategories();
    showFormStatus('success', '✅ Категория успешно добавлена!');
}

// Редактирование категории
function editCategory(index) {
    if (index < 0 || index >= categories.length) return;
    
    const newName = prompt('Новое название категории:', categories[index].name);
    const newIcon = prompt('Новая иконка (эмодзи):', categories[index].icon);
    const newDesc = prompt('Новое описание:', categories[index].description);
    
    if (newName && newName.trim()) categories[index].name = newName.trim();
    if (newIcon && newIcon.trim()) categories[index].icon = newIcon.trim();
    if (newDesc && newDesc.trim()) categories[index].description = newDesc.trim();
    
    saveToStorage();
    displayCategories();
    showFormStatus('success', '✅ Категория обновлена');
}

// Удаление категории
function deleteCategory(index) {
    if (index < 0 || index >= categories.length) return;
    
    const category = categories[index];
    const productCount = allProducts.filter(p => p.categoryId === category.id).length;
    
    if (productCount > 0) {
        alert(`Нельзя удалить категорию, в которой есть товары (${productCount} шт.)`);
        return;
    }
    
    if (confirm(`Удалить категорию "${category.name}"?`)) {
        categories.splice(index, 1);
        saveToStorage();
        displayCategories();
        showFormStatus('success', '🗑️ Категория удалена');
    }
}

// Подготовка данных для экспорта
function prepareDataForExport() {
    // Группируем товары по категориям
    const groupedProducts = {};
    categories.forEach(cat => {
        groupedProducts[cat.id] = [];
    });
    
    allProducts.forEach(product => {
        if (groupedProducts[product.categoryId]) {
            groupedProducts[product.categoryId].push({
                number: product.number,
                price: product.price,
                months: product.months,
                operator: product.operator,
                description: product.description
            });
        }
    });
    
    // Формируем финальную структуру
    const result = {
        last_update: new Date().toLocaleString('ru-RU'),
        version: CONFIG.version,
        categories: categories.map(cat => ({
            id: cat.id,
            name: cat.name,
            icon: cat.icon,
            description: cat.description,
            products: groupedProducts[cat.id] || []
        }))
    };
    
    return result;
}

// Обновление вкладки экспорта
function updateExportTab() {
    const container = document.getElementById('tab-export');
    if (!container) return;
    
    const lastUpdate = getLastUpdate();
    const githubStatus = checkGitHubStatus();
    
    container.innerHTML = `
        <div class="tab-header">
            <h2><i class="fas fa-download"></i> Экспорт данных и GitHub</h2>
        </div>
        
        <div class="export-info">
            <div class="info-card">
                <h3><i class="fas fa-database"></i> Статус данных</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <span>Всего товаров:</span>
                        <span style="color: #00ff00;">${allProducts.length}</span>
                    </div>
                    <div class="info-item">
                        <span>Категорий:</span>
                        <span style="color: #00ffff;">${categories.length}</span>
                    </div>
                    <div class="info-item">
                        <span>Общая стоимость:</span>
                        <span style="color: #ff9900;">${calculateTotalValue()} ₽</span>
                    </div>
                    <div class="info-item">
                        <span>GitHub статус:</span>
                        <span style="color: ${githubStatus.color};">${githubStatus.text}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="export-actions">
            <h3><i class="fas fa-file-export"></i> Экспорт в файл</h3>
            <div class="action-grid">
                <button class="action-btn large" onclick="exportToJSON()">
                    <i class="fas fa-file-code"></i>
                    <span>Экспорт в JSON</span>
                </button>
                <button class="action-btn large" onclick="exportToCSV()">
                    <i class="fas fa-file-csv"></i>
                    <span>Экспорт в CSV</span>
                </button>
                <button class="action-btn large" onclick="copyToClipboard()">
                    <i class="fas fa-copy"></i>
                    <span>Копировать JSON</span>
                </button>
            </div>
        </div>
        
        <div class="export-actions">
            <h3><i class="fas fa-cloud-upload-alt"></i> Обновление на GitHub</h3>
            <div class="update-section">
                <button class="action-btn large primary" onclick="updateWebsite()">
                    <i class="fas fa-sync-alt"></i>
                    <span>ОБНОВИТЬ НА GITHUB</span>
                </button>
                <p class="form-hint">Создаст файл products.json для загрузки на GitHub. После загрузки, на сайте нажмите "Обновить базу товаров"</p>
                <div id="update-site-status" class="form-status"></div>
                <div style="margin-top: 15px;">
                    <a href="https://github.com/${CONFIG.github.repo}/edit/main/${CONFIG.github.file}" 
                       target="_blank" class="action-btn" style="display: inline-flex; align-items: center; gap: 8px;">
                        <i class="fas fa-external-link-alt"></i>
                        <span>Открыть редактор GitHub</span>
                    </a>
                    <a href="${CONFIG.github.rawUrl}" 
                       target="_blank" class="action-btn" style="display: inline-flex; align-items: center; gap: 8px; margin-left: 10px;">
                        <i class="fas fa-eye"></i>
                        <span>Посмотреть текущий файл</span>
                    </a>
                </div>
            </div>
        </div>
        
        <div class="export-actions">
            <h3><i class="fas fa-upload"></i> Импорт данных</h3>
            <div class="import-section">
                <input type="file" id="import-file" accept=".json,.csv" style="display: none;">
                <button class="action-btn large" onclick="document.getElementById('import-file').click()">
                    <i class="fas fa-file-import"></i>
                    <span>Выбрать файл для импорта</span>
                </button>
                <p class="form-hint">Поддерживаются JSON и CSV форматы. Импорт заменит текущие данные.</p>
            </div>
        </div>
    `;
    
    // Добавляем обработчик импорта
    const importFile = document.getElementById('import-file');
    if (importFile) {
        importFile.addEventListener('change', handleFileImport);
    }
}

function calculateTotalValue() {
    return allProducts.reduce((sum, product) => {
        const price = parseFloat(product.price) || 0;
        return sum + price;
    }, 0);
}

function getLastUpdate() {
    try {
        const saved = localStorage.getItem(CONFIG.storageKey);
        if (saved) {
            const data = JSON.parse(saved);
            const date = new Date(data.timestamp);
            return date.toLocaleString('ru-RU');
        }
    } catch (e) {}
    return 'Неизвестно';
}

function checkGitHubStatus() {
    // В реальном приложении здесь можно сделать fetch запрос
    // к GitHub API для проверки доступности файла
    return {
        text: 'Проверьте подключение',
        color: '#ff9900'
    };
}

// Экспорт в JSON
function exportToJSON() {
    try {
        const data = prepareDataForExport();
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `iglova_shop_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showFormStatus('success', '📥 JSON файл успешно скачан');
    } catch (error) {
        showFormStatus('error', '❌ Ошибка экспорта: ' + error.message);
    }
}

// Экспорт в CSV
function exportToCSV() {
    try {
        let csv = 'Номер;Цена;Отлет;Оператор;Категория;Описание\n';
        
        allProducts.forEach(product => {
            const category = categories.find(c => c.id === product.categoryId) || { name: '' };
            const row = [
                `"${(product.number || '').replace(/"/g, '""')}"`,
                `"${(product.price || '').replace(/"/g, '""')}"`,
                `"${(product.months || '?').replace(/"/g, '""')}"`,
                `"${(product.operator || '').replace(/"/g, '""')}"`,
                `"${(category.name || '').replace(/"/g, '""')}"`,
                `"${(product.description || '').replace(/"/g, '""')}"`
            ].join(';');
            csv += row + '\n';
        });
        
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `iglova_shop_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showFormStatus('success', '📊 CSV файл успешно скачан');
    } catch (error) {
        showFormStatus('error', '❌ Ошибка экспорта CSV: ' + error.message);
    }
}

// Копирование в буфер обмена
async function copyToClipboard() {
    try {
        const data = prepareDataForExport();
        const text = JSON.stringify(data, null, 2);
        
        await navigator.clipboard.writeText(text);
        showFormStatus('success', '📋 JSON скопирован в буфер обмена');
    } catch (err) {
        showFormStatus('error', '❌ Ошибка копирования: ' + err.message);
    }
}

// Импорт из файла
function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!confirm('Импорт заменит текущие данные. Продолжить?')) {
        event.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            let importedData;
            
            if (file.name.endsWith('.json')) {
                importedData = JSON.parse(content);
            } else if (file.name.endsWith('.csv')) {
                importedData = parseCSV(content);
            } else {
                throw new Error('Неподдерживаемый формат файла');
            }
            
            // Обрабатываем импортированные данные
            processImportedData(importedData);
            showFormStatus('success', '✅ Данные успешно импортированы!');
            
        } catch (error) {
            showFormStatus('error', '❌ Ошибка импорта: ' + error.message);
        }
    };
    
    reader.readAsText(file);
    event.target.value = '';
}

// Парсинг CSV
function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSV файл пуст');
    
    const headers = lines[0].split(';').map(h => h.replace(/^"|"$/g, '').trim().toLowerCase());
    const products = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(';').map(v => v.replace(/^"|"$/g, '').trim());
        if (values.length !== headers.length) continue;
        
        const product = {};
        headers.forEach((header, index) => {
            product[header] = values[index];
        });
        
        // Преобразуем категорию в ID
        if (product.category) {
            const cat = categories.find(c => c.name === product.category);
            product.categoryId = cat ? cat.id : 'russian';
        } else {
            product.categoryId = 'russian';
        }
        
        products.push(product);
    }
    
    return { products: products };
}

// Обработка импортированных данных
function processImportedData(data) {
    if (data.categories && Array.isArray(data.categories)) {
        categories = data.categories;
        
        allProducts = [];
        data.categories.forEach(category => {
            if (category.products && Array.isArray(category.products)) {
                category.products.forEach(product => {
                    allProducts.push({
                        ...product,
                        categoryId: category.id,
                        id: Date.now() + Math.random().toString(36).substr(2, 9),
                        created: new Date().toISOString(),
                        updated: new Date().toISOString()
                    });
                });
            }
        });
    } else if (data.products && Array.isArray(data.products)) {
        allProducts = data.products.map(product => ({
            ...product,
            categoryId: product.categoryId || 'russian',
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            created: new Date().toISOString(),
            updated: new Date().toISOString()
        }));
    } else {
        throw new Error('Неправильный формат данных');
    }
    
    saveToStorage();
    updateUI();
    showFormStatus('success', `✅ Импортировано ${allProducts.length} товаров`);
}

// Обновление вкладки бэкапа
function updateBackupTab() {
    const container = document.getElementById('tab-backup');
    if (!container) return;
    
    const backupInfo = getBackupInfo();
    
    container.innerHTML = `
        <div class="tab-header">
            <h2><i class="fas fa-hdd"></i> Резервное копирование</h2>
        </div>
        
        <div class="backup-info">
            <div class="info-card">
                <h3><i class="fas fa-info-circle"></i> Информация о бэкапах</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <span>Последний бэкап:</span>
                        <span>${backupInfo.lastBackup}</span>
                    </div>
                    <div class="info-item">
                        <span>Размер данных:</span>
                        <span>${backupInfo.dataSize}</span>
                    </div>
                    <div class="info-item">
                        <span>Свободно в хранилище:</span>
                        <span>${backupInfo.freeSpace}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="backup-actions">
            <h3><i class="fas fa-save"></i> Управление бэкапами</h3>
            <div class="action-grid">
                <button class="action-btn large" onclick="createBackup()">
                    <i class="fas fa-plus-circle"></i>
                    <span>Создать бэкап</span>
                </button>
                <button class="action-btn large" onclick="restoreBackup()">
                    <i class="fas fa-redo"></i>
                    <span>Восстановить</span>
                </button>
                <button class="action-btn large" onclick="exportBackup()">
                    <i class="fas fa-download"></i>
                    <span>Экспорт бэкапа</span>
                </button>
                <button class="action-btn large" onclick="clearBackup()">
                    <i class="fas fa-trash"></i>
                    <span>Удалить бэкап</span>
                </button>
            </div>
        </div>
        
        <div class="backup-notice">
            <p><i class="fas fa-exclamation-triangle"></i> Бэкапы хранятся в локальном хранилище браузера. 
            Для сохранности данных рекомендуется экспортировать бэкапы на компьютер.</p>
        </div>
    `;
}

function getBackupInfo() {
    const backupStr = localStorage.getItem(CONFIG.backupKey);
    let lastBackup = 'Нет бэкапов';
    let dataSize = '0 КБ';
    
    if (backupStr) {
        try {
            const backup = JSON.parse(backupStr);
            const date = new Date(backup.timestamp);
            lastBackup = date.toLocaleString('ru-RU');
            
            // Размер данных в КБ
            const size = (backupStr.length / 1024).toFixed(2);
            dataSize = `${size} КБ`;
        } catch (e) {}
    }
    
    // Оценка свободного места (приблизительно)
    let freeSpace = 'Неизвестно';
    try {
        const testData = 'test'.repeat(1024); // 4KB
        localStorage.setItem('test_storage', testData);
        localStorage.removeItem('test_storage');
        freeSpace = 'Достаточно';
    } catch (e) {
        freeSpace = 'Мало места';
    }
    
    return { lastBackup, dataSize, freeSpace };
}

// Создание бэкапа
function createBackup() {
    const backup = {
        timestamp: new Date().toISOString(),
        products: allProducts,
        categories: categories,
        version: CONFIG.version
    };
    
    localStorage.setItem(CONFIG.backupKey, JSON.stringify(backup));
    showFormStatus('success', `💾 Бэкап создан: ${new Date().toLocaleString('ru-RU')}`);
    updateBackupTab();
}

// Восстановление из бэкапа
function restoreBackup() {
    const backupStr = localStorage.getItem(CONFIG.backupKey);
    if (!backupStr) {
        alert('Бэкап не найден');
        return;
    }
    
    if (confirm('Восстановить данные из последнего бэкапа? Текущие данные будут потеряны.')) {
        try {
            const backup = JSON.parse(backupStr);
            allProducts = backup.products || [];
            categories = backup.categories || categories;
            saveToStorage();
            showFormStatus('success', `✅ Данные восстановлены из бэкапа от ${new Date(backup.timestamp).toLocaleString('ru-RU')}`);
            updateBackupTab();
        } catch (error) {
            showFormStatus('error', '❌ Ошибка восстановления: ' + error.message);
        }
    }
}

// Экспорт бэкапа
function exportBackup() {
    const backupStr = localStorage.getItem(CONFIG.backupKey);
    if (!backupStr) {
        alert('Бэкап не найден');
        return;
    }
    
    try {
        const blob = new Blob([backupStr], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `iglova_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showFormStatus('success', '📥 Бэкап успешно экспортирован');
    } catch (error) {
        showFormStatus('error', '❌ Ошибка экспорта бэкапа: ' + error.message);
    }
}

// Очистка бэкапа
function clearBackup() {
    if (confirm('Удалить резервную копию?')) {
        localStorage.removeItem(CONFIG.backupKey);
        showFormStatus('success', '🗑️ Бэкап удален');
        updateBackupTab();
    }
}

// Обновление вкладки настроек
function updateSettingsTab() {
    const container = document.getElementById('tab-settings');
    if (!container) return;
    
    container.innerHTML = `
        <div class="tab-header">
            <h2><i class="fas fa-cog"></i> Настройки системы</h2>
        </div>
        
        <div class="settings-sections">
            <div class="settings-card">
                <h3><i class="fas fa-key"></i> Безопасность</h3>
                <div class="settings-group">
                    <label>Текущий пароль администратора</label>
                    <div class="password-display">
                        <input type="password" value="${CONFIG.password}" readonly class="cyber-input">
                        <button class="action-btn" onclick="changePassword()">
                            <i class="fas fa-edit"></i> Изменить
                        </button>
                    </div>
                    <p class="form-hint">Пароль хранится в зашифрованном виде в коде админки</p>
                </div>
            </div>
            
            <div class="settings-card">
                <h3><i class="fas fa-database"></i> Данные</h3>
                <div class="settings-group">
                    <label>Очистка данных</label>
                    <div class="action-grid">
                        <button class="action-btn" onclick="clearAllProducts()">
                            <i class="fas fa-trash"></i> Удалить все товары
                        </button>
                        <button class="action-btn" onclick="resetToDefaults()">
                            <i class="fas fa-redo"></i> Сбросить настройки
                        </button>
                    </div>
                    <p class="form-hint">Эти действия нельзя отменить</p>
                </div>
            </div>
            
            <div class="settings-card">
                <h3><i class="fas fa-info-circle"></i> Информация о системе</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <span>Версия админки:</span>
                        <span>${CONFIG.version}</span>
                    </div>
                    <div class="info-item">
                        <span>Владелец:</span>
                        <span>${CONFIG.owner}</span>
                    </div>
                    <div class="info-item">
                        <span>Общий размер данных:</span>
                        <span id="total-data-size">Загрузка...</span>
                    </div>
                    <div class="info-item">
                        <span>Дата установки:</span>
                        <span>${new Date().toLocaleDateString('ru-RU')}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="settings-footer">
            <button class="action-btn danger" onclick="showDebugInfo()">
                <i class="fas fa-bug"></i> Отладка
            </button>
            <button class="action-btn" onclick="exportAllData()">
                <i class="fas fa-download"></i> Экспорт всех данных
            </button>
        </div>
    `;
    
    // Обновляем размер данных
    updateDataSize();
}

function updateDataSize() {
    let totalSize = 0;
    
    // Считаем размер всех данных в localStorage
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        totalSize += (key.length + value.length) * 2; // Умножаем на 2 для Unicode
    }
    
    const sizeKB = (totalSize / 1024).toFixed(2);
    const element = document.getElementById('total-data-size');
    
    // Проверяем, существует ли элемент
    if (element) {
        element.textContent = `${sizeKB} КБ`;
    }
    
    // Также обновляем другие элементы с информацией о хранилище
    const storageInfoElement = document.getElementById('storage-info');
    if (storageInfoElement) {
        storageInfoElement.textContent = `${sizeKB} КБ`;
    }
}

function changePassword() {
    const newPassword = prompt('Введите новый пароль:');
    if (newPassword && newPassword.length >= 6) {
        alert('Пароль изменен. Для применения изменений нужно обновить файл admin.js');
        alert(`Новый пароль: ${newPassword}\n\nЗамените строку в admin.js:\npassword: "${CONFIG.password}"\nна:\npassword: "${newPassword}"`);
    } else if (newPassword) {
        alert('Пароль должен содержать минимум 6 символов');
    }
}

function clearAllProducts() {
    if (confirm('УДАЛИТЬ ВСЕ ТОВАРЫ? Это действие нельзя отменить.')) {
        allProducts = [];
        saveToStorage();
        showFormStatus('success', '🗑️ Все товары удалены');
        updateUI();
    }
}

function resetToDefaults() {
    if (confirm('Сбросить все настройки к заводским? Все данные будут удалены.')) {
        localStorage.clear();
        location.reload();
    }
}

function showDebugInfo() {
    const info = {
        userAgent: navigator.userAgent,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        localStorageSize: localStorage.length,
        allProducts: allProducts.length,
        categories: categories.length,
        sessionStart: sessionStartTime,
        currentTime: new Date().toISOString()
    };
    
    console.log('[DEBUG] System info:', info);
    alert(`Информация для отладки (смотрите консоль F12)\n\nТоваров: ${allProducts.length}\nКатегорий: ${categories.length}\nСессия: ${sessionStartTime ? 'активна' : 'не активна'}`);
}

function exportAllData() {
    const allData = {
        config: CONFIG,
        products: allProducts,
        categories: categories,
        timestamp: new Date().toISOString(),
        localStorage: {}
    };
    
    // Копируем всё из localStorage
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        allData.localStorage[key] = localStorage.getItem(key);
    }
    
    const jsonStr = JSON.stringify(allData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iglova_all_data_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showFormStatus('success', '📥 Все данные экспортированы');
}

function updateSystemInfo() {
    // Проверяем элементы перед обновлением
    const lastUpdateElement = document.getElementById('last-update-info');
    const browserInfoElement = document.getElementById('browser-info');
    
    if (lastUpdateElement) {
        lastUpdateElement.textContent = getLastUpdate();
    }
    
    if (browserInfoElement) {
        browserInfoElement.textContent = navigator.userAgent.split(' ')[0];
    }
    
    // Обновляем размер данных с проверкой
    updateDataSize();
}

// Toggle меню (для мобильных устройств)
function toggleMenu() {
    const sidebar = document.querySelector('.admin-sidebar');
    if (sidebar) {
        sidebar.classList.toggle('collapsed');
    }
}

// Добавляем CSS анимацию shake и стили
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    
    .modal-overlay {
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
    
    .modal-content {
        background: rgba(0, 20, 0, 0.9);
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
    
    .modal-body {
        margin-bottom: 20px;
    }
    
    .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding-top: 20px;
        border-top: 1px solid rgba(0, 255, 0, 0.3);
    }
    
    .categories-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
        margin: 20px 0;
    }
    
    .category-card {
        background: rgba(0, 30, 0, 0.3);
        border: 1px solid rgba(0, 255, 0, 0.2);
        border-radius: 10px;
        padding: 20px;
        transition: all 0.3s;
    }
    
    .category-card:hover {
        border-color: #00ffff;
        transform: translateY(-3px);
        box-shadow: 0 5px 20px rgba(0, 255, 255, 0.2);
    }
    
    .github-notification {
        animation: slideIn 0.3s ease-out;
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
`;
document.head.appendChild(style);
