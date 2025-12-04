// ===== АДМИН-ПАНЕЛЬ IGLOV SHOP =====
// Конфигурация
const CONFIG = {
    password: "iglova2025", // ИЗМЕНИТЕ ЭТОТ ПАРОЛЬ!
    backupKey: "iglova_shop_backup_v2",
    productsFile: "products.json",
    storageKey: "iglova_admin_data",
    version: "2.0"
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

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    console.log(`[ADMIN] IGLOV SHOP Admin v${CONFIG.version} initialized`);
    
    // Проверяем авторизацию
    if (localStorage.getItem('admin_authenticated') === 'true') {
        showAdminPanel();
    }
    
    // Загружаем данные
    loadFromStorage();
    updateUI();
    
    // Обработка формы добавления товара
    document.getElementById('add-product-form').addEventListener('submit', function(e) {
        e.preventDefault();
        addProduct();
    });
    
    // Обработка импорта файла
    document.getElementById('import-file').addEventListener('change', handleFileImport);
    
    // Запускаем таймер сессии
    startSessionTimer();
    
    // Обновляем каждые 30 секунд
    setInterval(updateUI, 30000);
});

// Проверка пароля
function checkPassword() {
    const password = document.getElementById('admin-password').value;
    const errorElement = document.getElementById('password-error');
    
    if (password === CONFIG.password) {
        localStorage.setItem('admin_authenticated', 'true');
        showAdminPanel();
        showStatus('success', '✅ Успешный вход в систему');
    } else {
        errorElement.style.display = 'block';
        errorElement.textContent = '❌ Неверный пароль';
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 3000);
    }
}

// Показать админ-панель
function showAdminPanel() {
    document.getElementById('password-screen').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
    sessionStartTime = new Date();
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
        document.getElementById('session-time').textContent = timeStr;
    }, 1000);
}

// Переключение вкладок
function switchTab(tabName) {
    // Скрываем все вкладки
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Убираем активность у всех кнопок
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Показываем нужную вкладку
    document.getElementById(`tab-${tabName}`).classList.add('active');
    
    // Активируем кнопку
    document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');
    
    // Обновляем данные если нужно
    if (tabName === 'products') {
        displayProducts();
    } else if (tabName === 'categories') {
        displayCategories();
    } else if (tabName === 'export') {
        updateExportInfo();
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
        }
    } catch (e) {
        console.error('[ERROR] Ошибка загрузки из хранилища:', e);
        allProducts = [];
    }
}

// Сохранение данных в localStorage
function saveToStorage() {
    const data = {
        timestamp: new Date().toISOString(),
        products: allProducts,
        categories: categories,
        version: CONFIG.version
    };
    
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(data));
    updateUI();
    console.log(`[SAVE] Сохранено ${allProducts.length} товаров`);
}

// Обновление интерфейса
function updateUI() {
    displayProducts();
    displayCategories();
    updateExportInfo();
}

// Отображение товаров
function displayProducts() {
    const tbody = document.getElementById('products-list');
    const countElement = document.getElementById('products-count');
    
    if (!tbody || !countElement) return;
    
    if (allProducts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: #888; padding: 40px;">
                    <i class="fas fa-box-open" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    🛒 Товаров пока нет. Добавьте первый товар!
                </td>
            </tr>
        `;
        countElement.textContent = 'Товаров: 0';
        return;
    }
    
    let html = '';
    allProducts.forEach((product, index) => {
        const category = categories.find(c => c.id === product.categoryId) || { name: 'Без категории', icon: '❓' };
        const price = product.price || '0 ₽';
        const months = product.months || '?';
        const operator = product.operator || '-';
        
        html += `
            <tr>
                <td style="color: #ff9900; font-weight: bold;">${index + 1}</td>
                <td><strong style="color: #00ffff;">${product.number || product.name || 'Без названия'}</strong></td>
                <td><span style="color: #ff9900; font-weight: bold;">${price}</span></td>
                <td>${category.icon} ${category.name}</td>
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
    countElement.innerHTML = `<i class="fas fa-box"></i> Товаров: <strong>${allProducts.length}</strong>`;
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
    
    document.getElementById('products-count').innerHTML = 
        `<i class="fas fa-filter"></i> Показано: <strong>${visibleCount}</strong> из ${allProducts.length}`;
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
        showStatus('error', '❌ Введите номер телефона или название товара');
        return;
    }
    
    if (!price || isNaN(parseFloat(price))) {
        showStatus('error', '❌ Введите корректную цену (только цифры)');
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
    
    // Добавляем в массив
    allProducts.push(product);
    
    // Сохраняем
    saveToStorage();
    
    // Очищаем форму
    resetForm();
    
    // Показываем статус
    showStatus('success', '✅ Товар успешно добавлен!');
    
    // Переключаемся на список товаров
    setTimeout(() => switchTab('products'), 1000);
}

// Редактирование товара
function editProduct(index) {
    const product = allProducts[index];
    
    // Заполняем форму
    document.getElementById('product-number').value = product.number;
    document.getElementById('product-price').value = product.price.replace(' ₽', '');
    document.getElementById('product-months').value = product.months || '?';
    document.getElementById('product-operator').value = product.operator || '';
    document.getElementById('product-category').value = product.categoryId;
    document.getElementById('product-description').value = product.description || '';
    
    // Меняем кнопку
    const form = document.getElementById('add-product-form');
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<span class="btn-number">[💾]</span><span>ОБНОВИТЬ ТОВАР</span>';
    
    // Удаляем старый обработчик и добавляем новый
    form.onsubmit = function(e) {
        e.preventDefault();
        updateProduct(index);
    };
    
    // Переключаемся на форму
    switchTab('add');
}

// Обновление товара
function updateProduct(index) {
    const number = document.getElementById('product-number').value.trim();
    const price = document.getElementById('product-price').value.trim();
    const months = document.getElementById('product-months').value;
    const operator = document.getElementById('product-operator').value;
    const categoryId = document.getElementById('product-category').value;
    const description = document.getElementById('product-description').value.trim();
    
    // Обновляем товар
    allProducts[index] = {
        ...allProducts[index],
        number: number,
        price: price.includes('₽') ? price : price + ' ₽',
        months: months,
        operator: operator,
        categoryId: categoryId,
        description: description,
        updated: new Date().toISOString()
    };
    
    // Сохраняем
    saveToStorage();
    
    // Сбрасываем форму
    resetForm();
    
    // Показываем статус
    showStatus('success', '✅ Товар успешно обновлен!');
    
    // Возвращаем кнопку в исходное состояние
    const submitBtn = document.querySelector('#add-product-form button[type="submit"]');
    submitBtn.innerHTML = '<span class="btn-number">[💾]</span><span>СОХРАНИТЬ ТОВАР</span>';
    
    // Восстанавливаем обработчик
    document.getElementById('add-product-form').onsubmit = function(e) {
        e.preventDefault();
        addProduct();
    };
    
    // Переключаемся на список
    setTimeout(() => switchTab('products'), 1000);
}

// Удаление товара
function deleteProduct(index) {
    if (confirm(`❌ Удалить товар "${allProducts[index].number}"?`)) {
        const deleted = allProducts.splice(index, 1)[0];
        saveToStorage();
        showStatus('success', `🗑️ Товар "${deleted.number}" удален`);
    }
}

// Сброс формы
function resetForm() {
    document.getElementById('add-product-form').reset();
    const submitBtn = document.querySelector('#add-product-form button[type="submit"]');
    submitBtn.innerHTML = '<span class="btn-number">[💾]</span><span>СОХРАНИТЬ ТОВАР</span>';
    
    // Восстанавливаем обработчик
    document.getElementById('add-product-form').onsubmit = function(e) {
        e.preventDefault();
        addProduct();
    };
    
    document.getElementById('add-status').className = 'status';
}

// Отображение категорий
function displayCategories() {
    const container = document.getElementById('categories-list');
    if (!container) return;
    
    let html = '';
    
    categories.forEach((cat, index) => {
        const productCount = allProducts.filter(p => p.categoryId === cat.id).length;
        const productsInCat = allProducts.filter(p => p.categoryId === cat.id);
        const totalValue = productsInCat.reduce((sum, p) => {
            const price = parseFloat(p.price) || 0;
            return sum + price;
        }, 0);
        
        html += `
            <div class="category-card">
                <div class="category-icon">${cat.icon}</div>
                <div class="category-name">${cat.name}</div>
                <div class="category-desc">${cat.description}</div>
                <div class="category-stats">
                    <div><i class="fas fa-box"></i> Товаров: ${productCount}</div>
                    <div><i class="fas fa-ruble-sign"></i> Общая стоимость: ${Math.round(totalValue)} ₽</div>
                </div>
                <div style="margin-top: 15px;">
                    <button class="action-btn edit-btn" onclick="editCategory(${index})" title="Редактировать">
                        <i class="fas fa-edit"></i> Изменить
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteCategory(${index})" 
                            ${productCount > 0 ? 'disabled style="opacity:0.5"' : ''} title="${productCount > 0 ? 'Нельзя удалить категорию с товарами' : 'Удалить'}">
                        <i class="fas fa-trash"></i> Удалить
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Добавление категории
function addCategory() {
    const name = document.getElementById('new-category-name').value.trim();
    const icon = document.getElementById('new-category-icon').value.trim();
    const id = document.getElementById('new-category-id').value.trim().toLowerCase().replace(/\s+/g, '_');
    
    if (!name || !icon || !id) {
        showStatus('error', '❌ Заполните все поля');
        return;
    }
    
    if (!/^[a-z0-9_]+$/.test(id)) {
        showStatus('error', '❌ ID может содержать только английские буквы, цифры и нижнее подчеркивание');
        return;
    }
    
    // Проверяем уникальность ID
    if (categories.some(c => c.id === id)) {
        showStatus('error', '❌ Категория с таким ID уже существует');
        return;
    }
    
    // Добавляем категорию
    categories.push({
        id: id,
        name: name,
        icon: icon,
        description: 'Новая категория товаров'
    });
    
    // Сохраняем
    saveToStorage();
    
    // Очищаем поля
    document.getElementById('new-category-name').value = '';
    document.getElementById('new-category-icon').value = '';
    document.getElementById('new-category-id').value = '';
    
    showStatus('success', '✅ Категория успешно добавлена!');
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
    showStatus('success', '✅ Категория обновлена');
}

// Удаление категории
function deleteCategory(index) {
    const category = categories[index];
    const productCount = allProducts.filter(p => p.categoryId === category.id).length;
    
    if (productCount > 0) {
        showStatus('error', `❌ Нельзя удалить категорию, в которой есть товары (${productCount} шт.)`);
        return;
    }
    
    if (confirm(`Удалить категорию "${category.name}"?`)) {
        categories.splice(index, 1);
        saveToStorage();
        showStatus('success', '🗑️ Категория удалена');
    }
}

// Обновление информации экспорта
function updateExportInfo() {
    const statusElement = document.getElementById('data-status');
    const totalElement = document.getElementById('total-products');
    const updateElement = document.getElementById('last-update-admin');
    
    if (!statusElement || !totalElement || !updateElement) return;
    
    try {
        const saved = localStorage.getItem(CONFIG.storageKey);
        if (saved) {
            const data = JSON.parse(saved);
            const date = new Date(data.timestamp);
            updateElement.textContent = date.toLocaleString('ru-RU');
        } else {
            updateElement.textContent = 'Нет данных';
        }
        
        totalElement.textContent = allProducts.length;
        statusElement.textContent = '✅ Готово';
        statusElement.style.color = '#00ff00';
    } catch (e) {
        statusElement.textContent = '❌ Ошибка';
        statusElement.style.color = '#ff3333';
    }
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
        
        showStatus('success', '📥 JSON файл успешно скачан');
    } catch (error) {
        showStatus('error', '❌ Ошибка экспорта: ' + error.message);
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
        
        showStatus('success', '📊 CSV файл успешно скачан');
    } catch (error) {
        showStatus('error', '❌ Ошибка экспорта CSV: ' + error.message);
    }
}

// Копирование в буфер обмена
async function copyToClipboard() {
    try {
        const data = prepareDataForExport();
        const text = JSON.stringify(data, null, 2);
        
        await navigator.clipboard.writeText(text);
        showStatus('success', '📋 JSON скопирован в буфер обмена');
    } catch (err) {
        showStatus('error', '❌ Ошибка копирования: ' + err.message);
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

// Импорт из файла
function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
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
            showStatus('success', '✅ Данные успешно импортированы!');
            
        } catch (error) {
            showStatus('error', '❌ Ошибка импорта: ' + error.message);
        }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Сброс input
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
        // Если импортирована полная структура
        categories = data.categories;
        
        // Собираем все товары
        allProducts = [];
        data.categories.forEach(category => {
            if (category.products && Array.isArray(category.products)) {
                category.products.forEach(product => {
                    allProducts.push({
                        ...product,
                        categoryId: category.id,
                        id: Date.now() + Math.random().toString(36).substr(2, 9)
                    });
                });
            }
        });
    } else if (data.products && Array.isArray(data.products)) {
        // Если импортированы только товары
        allProducts = data.products.map(product => ({
            ...product,
            categoryId: product.categoryId || 'russian',
            id: Date.now() + Math.random().toString(36).substr(2, 9)
        }));
    } else {
        throw new Error('Неправильный формат данных');
    }
    
    saveToStorage();
    updateUI();
}

// Обновление сайта
function updateWebsite() {
    try {
        const data = prepareDataForExport();
        const jsonStr = JSON.stringify(data, null, 2);
        const statusElement = document.getElementById('update-status');
        
        // Создаем виртуальный файл
        const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        statusElement.innerHTML = `
            <div class="status success">
                <h4><i class="fas fa-check-circle"></i> Данные подготовлены!</h4>
                <p>Для обновления сайта:</p>
                <ol>
                    <li>Скачайте файл: 
                        <a href="${url}" download="products.json" class="cyber-link">
                            <i class="fas fa-download"></i> products.json
                        </a>
                    </li>
                    <li>Замените файл <code>products.json</code> в корне сайта</li>
                    <li>Обновите страницу магазина</li>
                </ol>
                <p style="margin-top: 15px; color: #ff9900;">
                    <i class="fas fa-info-circle"></i> Всего товаров: <strong>${allProducts.length}</strong><br>
                    Дата обновления: ${data.last_update}
                </p>
            </div>
        `;
        
        // Автоматически очистим ссылку через минуту
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 60000);
        
    } catch (error) {
        document.getElementById('update-status').innerHTML = `
            <div class="status error">
                <i class="fas fa-exclamation-circle"></i> Ошибка: ${error.message}
            </div>
        `;
    }
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
    showStatus('success', `💾 Бэкап создан: ${new Date().toLocaleString('ru-RU')}`);
}

// Восстановление из бэкапа
function restoreBackup() {
    const backupStr = localStorage.getItem(CONFIG.backupKey);
    if (!backupStr) {
        showStatus('error', 'Бэкап не найден');
        return;
    }
    
    if (confirm('Восстановить данные из последнего бэкапа? Текущие данные будут потеряны.')) {
        try {
            const backup = JSON.parse(backupStr);
            allProducts = backup.products || [];
            categories = backup.categories || categories;
            saveToStorage();
            showStatus('success', `✅ Данные восстановлены из бэкапа от ${new Date(backup.timestamp).toLocaleString('ru-RU')}`);
        } catch (error) {
            showStatus('error', '❌ Ошибка восстановления: ' + error.message);
        }
    }
}

// Показать статус
function showStatus(type, message) {
    let statusElement = document.getElementById('add-status');
    if (!statusElement) {
        // Создаем элемент если его нет
        statusElement = document.createElement('div');
        statusElement.id = 'add-status';
        document.querySelector('#tab-add .tab-content').appendChild(statusElement);
    }
    
    statusElement.textContent = message;
    statusElement.className = `status ${type}`;
    
    // Автоматическое скрытие
    setTimeout(() => {
        if (statusElement.className.includes(type)) {
            statusElement.className = 'status';
        }
    }, 5000);
}

// Экспортируем нужные функции
window.switchTab = switchTab;
window.checkPassword = checkPassword;
window.addProduct = addProduct;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.resetForm = resetForm;
window.filterProducts = filterProducts;
window.addCategory = addCategory;
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;
window.exportToJSON = exportToJSON;
window.exportToCSV = exportToCSV;
window.copyToClipboard = copyToClipboard;
window.updateWebsite = updateWebsite;
window.createBackup = createBackup;
window.restoreBackup = restoreBackup;
window.logout = logout;
