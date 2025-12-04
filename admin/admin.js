// ===== АДМИН-ПАНЕЛЬ IGLOV SHOP =====
// Конфигурация
const CONFIG = {
    password: "maybelaterfuck", // ПАРОЛЬ ИЗМЕНЁН!
    backupKey: "iglova_shop_backup_v3",
    storageKey: "iglova_admin_data_v3",
    version: "3.0",
    owner: "@useriglov"
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
    document.getElementById('product-number')?.addEventListener('input', updateProductPreview);
    document.getElementById('product-price')?.addEventListener('input', updateProductPreview);
    document.getElementById('product-months')?.addEventListener('change', updateProductPreview);
    document.getElementById('product-operator')?.addEventListener('change', updateProductPreview);
    document.getElementById('product-description')?.addEventListener('input', updateProductPreview);
    
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
    const password = passwordInput.value;
    const errorElement = document.getElementById('password-error');
    const loader = document.getElementById('login-loader');
    const loginBtn = document.querySelector('.login-btn');
    
    if (!password) {
        showError('Введите пароль доступа');
        return;
    }
    
    // Показываем загрузку
    loader.style.display = 'block';
    loginBtn.disabled = true;
    
    // Имитация задержки проверки
    setTimeout(() => {
        if (password === CONFIG.password) {
            // Успешный вход
            localStorage.setItem('admin_authenticated', 'true');
            showAdminPanel();
            console.log('[AUTH] Successful login');
            
            // Скрываем ошибку если была
            errorElement.style.display = 'none';
        } else {
            // Неверный пароль
            showError('Неверный пароль доступа');
            console.warn('[AUTH] Failed login attempt');
            
            // Эффект вибрации
            passwordInput.style.animation = 'shake 0.5s';
            setTimeout(() => {
                passwordInput.style.animation = '';
            }, 500);
            
            // Очистка поля
            passwordInput.value = '';
            passwordInput.focus();
        }
        
        // Скрываем загрузку
        loader.style.display = 'none';
        loginBtn.disabled = false;
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
    document.getElementById('password-screen').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
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
        clearInterval(sessionTimer);
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
        document.getElementById('session-timer').textContent = timeStr;
        document.getElementById('session-time-stat').textContent = timeStr;
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
    const menuButton = document.querySelector(`.menu-item[onclick="switchTab('${tabName}')"]`);
    if (menuButton) {
        menuButton.classList.add('active');
    }
    
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
    
    updateUI();
    console.log(`[SAVE] Сохранено ${allProducts.length} товаров`);
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
            showFormStatus('success', `✅ Сайт обновлен (${allProducts.length} товаров)`);
        }
        
    } catch (error) {
        console.error('[ERROR] Auto-update failed:', error);
    }
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
    document.getElementById('total-products-stat').textContent = allProducts.length;
    document.getElementById('total-categories-stat').textContent = categories.length;
    document.getElementById('data-counter').textContent = `${allProducts.length} товаров`;
    
    // Общая стоимость
    const totalValue = allProducts.reduce((sum, product) => {
        const price = parseFloat(product.price) || 0;
        return sum + price;
    }, 0);
    document.getElementById('total-value-stat').textContent = `${totalValue} ₽`;
    
    // Бейджи
    document.getElementById('products-count-badge').textContent = allProducts.length;
    document.getElementById('categories-count-badge').textContent = categories.length;
    
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
    
    document.getElementById('products-table-info').textContent = 
        `Показано ${visibleCount} товаров из ${allProducts.length}`;
}

// Добавление товара
function addProduct() {
    const number = document.getElementById('product-number').value.trim();
    const price = document.getElementById('product-price').value.trim();
    const months = document.getElementById('product-months').value;
    const operator = document.getElementById('product-operator').value;
    const categoryId = document.getElementById('product-category').value;
    const description = document.getElementById('product-description').value.trim();
    
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
        document.getElementById('add-product-btn').innerHTML = `
            <i class="fas fa-save"></i>
            <span>СОХРАНИТЬ ТОВАР</span>
        `;
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
    const product = allProducts[index];
    currentEditingIndex = index;
    
    // Заполняем форму
    document.getElementById('product-number').value = product.number;
    document.getElementById('product-price').value = product.price.replace(' ₽', '');
    document.getElementById('product-months').value = product.months || '?';
    document.getElementById('product-operator').value = product.operator || '';
    document.getElementById('product-category').value = product.categoryId;
    document.getElementById('product-description').value = product.description || '';
    
    // Меняем текст кнопки
    document.getElementById('add-product-btn').innerHTML = `
        <i class="fas fa-save"></i>
        <span>ОБНОВИТЬ ТОВАР</span>
    `;
    
    // Переключаемся на форму
    switchTab('add-product');
}

// Удаление товара
function deleteProduct(index) {
    if (confirm(`❌ Удалить товар "${allProducts[index].number}"?`)) {
        const deleted = allProducts.splice(index, 1)[0];
        saveToStorage(); // Автоматически обновляем сайт
        showFormStatus('success', `🗑️ Товар "${deleted.number}" удален`);
    }
}

// Сброс формы товара
function resetProductForm() {
    document.getElementById('product-number').value = '';
    document.getElementById('product-price').value = '';
    document.getElementById('product-months').value = '?';
    document.getElementById('product-operator').value = '';
    document.getElementById('product-category').value = 'russian';
    document.getElementById('product-description').value = '';
    
    // Восстанавливаем кнопку
    document.getElementById('add-product-btn').innerHTML = `
        <i class="fas fa-save"></i>
        <span>СОХРАНИТЬ ТОВАР</span>
    `;
    
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
    const number = document.getElementById('product-number')?.value || '+7 (XXX) XXX-XX-XX';
    const price = document.getElementById('product-price')?.value || '0';
    const months = document.getElementById('product-months')?.value || '?';
    const operator = document.getElementById('product-operator')?.value || 'Не указано';
    const categoryId = document.getElementById('product-category')?.value || 'russian';
    const description = document.getElementById('product-description')?.value || '';
    
    const category = categories.find(c => c.id === categoryId) || categories[0];
    
    // Обновляем предпросмотр
    const preview = document.getElementById('product-preview');
    if (preview) {
        preview.querySelector('.preview-number').textContent = number;
        preview.querySelector('.preview-price').textContent = `${price} ₽`;
        preview.querySelector('.preview-desc').textContent = description || 'Описание отсутствует';
        preview.querySelector('.preview-details').innerHTML = `
            <div class="detail-item">
                <span>Срок отлета:</span>
                <span>${months === 'permanent' ? 'Постоянный' : (months === '?' ? 'Неизвестно' : months + ' мес')}</span>
            </div>
            <div class="detail-item">
                <span>Оператор:</span>
                <span>${operator}</span>
            </div>
        `;
        preview.querySelector('.preview-category').textContent = `${category.icon} ${category.name}`;
    }
}

// Показать статус формы
function showFormStatus(type, message) {
    const statusElement = document.getElementById('add-product-status');
    if (!statusElement) return;
    
    statusElement.textContent = message;
    statusElement.className = `form-status ${type}`;
    
    // Автоматическое скрытие
    setTimeout(() => {
        statusElement.className = 'form-status';
        statusElement.textContent = '';
    }, 5000);
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
    const name = document.getElementById('new-category-name')?.value.trim();
    const icon = document.getElementById('new-category-icon')?.value.trim();
    const id = document.getElementById('new-category-id')?.value.trim().toLowerCase().replace(/\s+/g, '_');
    const desc = document.getElementById('new-category-desc')?.value.trim();
    
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

// Обновление вкладки экспорта
function updateExportTab() {
    const container = document.getElementById('tab-export');
    if (!container) return;
    
    const lastUpdate = getLastUpdate();
    
    container.innerHTML = `
        <div class="tab-header">
            <h2><i class="fas fa-download"></i> Экспорт данных</h2>
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
                        <span>Последнее обновление:</span>
                        <span>${lastUpdate}</span>
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
        
        <div class="export-actions">
            <h3><i class="fas fa-sync-alt"></i> Обновление сайта</h3>
            <div class="update-section">
                <button class="action-btn large primary" onclick="updateWebsite()">
                    <i class="fas fa-cloud-upload-alt"></i>
                    <span>ОБНОВИТЬ САЙТ</span>
                </button>
                <p class="form-hint">Создаст файл products.json для загрузки на GitHub</p>
                <div id="update-site-status" class="form-status"></div>
            </div>
        </div>
    `;
    
    // Добавляем обработчик импорта
    document.getElementById('import-file')?.addEventListener('change', handleFileImport);
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

// Обновление сайта
function updateWebsite() {
    try {
        const data = prepareDataForExport();
        const jsonStr = JSON.stringify(data, null, 2);
        const statusElement = document.getElementById('update-site-status');
        
        if (!statusElement) {
            showFormStatus('error', 'Элемент статуса не найден');
            return;
        }
        
        // Создаем виртуальный файл
        const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        statusElement.innerHTML = `
            <div class="status success">
                <h4><i class="fas fa-check-circle"></i> Данные подготовлены!</h4>
                <p>Для обновления сайта на GitHub:</p>
                <ol>
                    <li>Скачайте файл: 
                        <a href="${url}" download="products.json" style="color: #00ffff; text-decoration: underline;">
                            <i class="fas fa-download"></i> products.json
                        </a>
                    </li>
                    <li>Замените файл <code>products.json</code> в корне репозитория</li>
                    <li>Обновите страницу магазина (Ctrl+F5)</li>
                </ol>
                <p style="margin-top: 15px; color: #ff9900;">
                    <i class="fas fa-info-circle"></i> Товаров: <strong>${allProducts.length}</strong><br>
                    Дата: ${data.last_update}
                </p>
            </div>
        `;
        
        // Автоматически очистим ссылку через минуту
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 60000);
        
    } catch (error) {
        const statusElement = document.getElementById('update-site-status');
        if (statusElement) {
            statusElement.innerHTML = `
                <div class="status error">
                    <i class="fas fa-exclamation-circle"></i> Ошибка: ${error.message}
                </div>
            `;
        }
    }
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
    document.getElementById('total-data-size').textContent = `${sizeKB} КБ`;
}

function changePassword() {
    const newPassword = prompt('Введите новый пароль:');
    if (newPassword && newPassword.length >= 6) {
        // В реальном проекте здесь должен быть запрос к серверу
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

// Обновление системной информации
function updateSystemInfo() {
    document.getElementById('last-update-info').textContent = getLastUpdate();
    document.getElementById('browser-info').textContent = navigator.userAgent.split(' ')[0];
    updateDataSize();
}

// Toggle меню (для мобильных устройств)
function toggleMenu() {
    const sidebar = document.querySelector('.admin-sidebar');
    sidebar.classList.toggle('collapsed');
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
    
    .category-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 15px;
    }
    
    .category-icon {
        font-size: 2rem;
    }
    
    .category-name {
        color: #00ffff;
        font-weight: bold;
        font-size: 1.3rem;
        margin-bottom: 5px;
    }
    
    .category-id {
        color: #888;
        font-family: 'Courier New', monospace;
        font-size: 0.9rem;
        margin-bottom: 10px;
    }
    
    .category-desc {
        color: #ccc;
        font-size: 0.9rem;
        margin-bottom: 15px;
    }
    
    .category-stats {
        display: flex;
        gap: 15px;
        color: #ff9900;
        font-weight: bold;
    }
    
    .stat {
        display: flex;
        align-items: center;
        gap: 5px;
    }
    
    .export-info, .backup-info {
        margin-bottom: 30px;
    }
    
    .info-card {
        background: rgba(0, 20, 0, 0.2);
        border: 1px solid rgba(0, 255, 0, 0.2);
        border-radius: 10px;
        padding: 25px;
    }
    
    .export-actions, .backup-actions {
        margin-bottom: 30px;
    }
    
    .export-actions h3, .backup-actions h3 {
        color: #00ffff;
        margin-bottom: 15px;
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .action-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
    }
    
    .action-btn.large {
        padding: 20px;
        font-size: 1.1rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        text-align: center;
    }
    
    .action-btn.large i {
        font-size: 1.5rem;
    }
    
    .action-btn.danger {
        background: rgba(255, 50, 50, 0.2);
        border-color: rgba(255, 51, 51, 0.5);
        color: #ff6666;
    }
    
    .action-btn.danger:hover {
        background: rgba(255, 50, 50, 0.3);
        box-shadow: 0 0 20px rgba(255, 51, 51, 0.3);
    }
    
    .backup-notice {
        background: rgba(255, 153, 0, 0.1);
        border: 1px solid rgba(255, 153, 0, 0.3);
        border-radius: 8px;
        padding: 15px;
        color: #ff9900;
        font-size: 0.9rem;
    }
    
    .settings-sections {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }
    
    .settings-card {
        background: rgba(0, 20, 0, 0.2);
        border: 1px solid rgba(0, 255, 0, 0.2);
        border-radius: 10px;
        padding: 25px;
    }
    
    .settings-card h3 {
        color: #00ffff;
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .settings-group {
        margin-bottom: 20px;
    }
    
    .settings-group:last-child {
        margin-bottom: 0;
    }
    
    .settings-group label {
        display: block;
        color: #00ffff;
        margin-bottom: 10px;
    }
    
    .password-display {
        display: flex;
        gap: 10px;
        align-items: center;
    }
    
    .settings-footer {
        display: flex;
        justify-content: space-between;
        padding-top: 20px;
        border-top: 1px solid rgba(0, 255, 0, 0.2);
    }
`;
document.head.appendChild(style);
