// Конфигурация
const CONFIG = {
    password: "iglova2025", // Пароль для доступа (поменяй!)
    backupKey: "iglova_shop_backup",
    productsFile: "../public/products.json"
};

// Глобальные переменные
let allProducts = [];
let categories = [
    { id: "russian", name: "НОМЕРА РФ", icon: "🇷🇺", description: "Российские номера с гарантией отлета" },
    { id: "foreign", name: "ЗАРУБЕЖНЫЕ", icon: "🌍", description: "Номера других стран" },
    { id: "nft_users", name: "NFT ЮЗЕРЫ", icon: "🎨", description: "NFT аккаунты и профили" },
    { id: "nft_gifts", name: "NFT ПОДАРКИ", icon: "🎁", description: "Цифровые подарки и активы" }
];

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    // Загружаем сохраненные данные
    loadFromStorage();
    updateUI();
    
    // Обработка формы добавления товара
    document.getElementById('add-product-form').addEventListener('submit', function(e) {
        e.preventDefault();
        addProduct();
    });
    
    // Обработка импорта файла
    document.getElementById('import-file').addEventListener('change', handleFileImport);
});

// Проверка пароля
function checkPassword() {
    const password = document.getElementById('admin-password').value;
    const errorElement = document.getElementById('password-error');
    
    if (password === CONFIG.password) {
        document.getElementById('password-screen').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';
        localStorage.setItem('admin_authenticated', 'true');
    } else {
        errorElement.style.display = 'block';
        errorElement.textContent = 'Неверный пароль';
    }
}

// Автопроверка если уже авторизован
if (localStorage.getItem('admin_authenticated') === 'true') {
    document.getElementById('password-screen').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
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
    const savedProducts = localStorage.getItem('iglova_products');
    const savedCategories = localStorage.getItem('iglova_categories');
    
    if (savedProducts) {
        allProducts = JSON.parse(savedProducts);
    }
    
    if (savedCategories) {
        categories = JSON.parse(savedCategories);
    }
}

// Сохранение данных в localStorage
function saveToStorage() {
    localStorage.setItem('iglova_products', JSON.stringify(allProducts));
    localStorage.setItem('iglova_categories', JSON.stringify(categories));
    updateUI();
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
    
    if (allProducts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: #888;">
                    🛒 Товаров пока нет. Добавьте первый товар!
                </td>
            </tr>
        `;
        countElement.textContent = 'Товаров: 0';
        return;
    }
    
    let html = '';
    allProducts.forEach((product, index) => {
        const category = categories.find(c => c.id === product.categoryId) || { name: 'Без категории' };
        
        html += `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${product.number || product.name}</strong></td>
                <td>${product.price} ₽</td>
                <td>${category.icon || ''} ${category.name}</td>
                <td>${product.months || '?'} мес</td>
                <td>
                    <button class="action-btn edit-btn" onclick="editProduct(${index})">✏️</button>
                    <button class="action-btn delete-btn" onclick="deleteProduct(${index})">🗑️</button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    countElement.textContent = `Товаров: ${allProducts.length}`;
}

// Фильтрация товаров
function filterProducts() {
    const searchTerm = document.getElementById('search-products').value.toLowerCase();
    const rows = document.querySelectorAll('#products-list tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
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
    if (!number || !price) {
        showStatus('error', 'Заполните обязательные поля: номер и цена');
        return;
    }
    
    // Создаем товар
    const product = {
        number: number,
        price: price.includes('₽') ? price : price + ' ₽',
        months: months,
        operator: operator,
        categoryId: categoryId,
        description: description,
        id: Date.now() // Уникальный ID
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
    submitBtn.textContent = '💾 ОБНОВИТЬ ТОВАР';
    submitBtn.onclick = function(e) {
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
        description: description
    };
    
    // Сохраняем
    saveToStorage();
    
    // Сбрасываем форму
    resetForm();
    
    // Показываем статус
    showStatus('success', '✅ Товар успешно обновлен!');
    
    // Возвращаем кнопку в исходное состояние
    const submitBtn = document.querySelector('#add-product-form button[type="submit"]');
    submitBtn.textContent = '💾 СОХРАНИТЬ ТОВАР';
    submitBtn.onclick = null;
    
    // Переключаемся на список
    setTimeout(() => switchTab('products'), 1000);
}

// Удаление товара
function deleteProduct(index) {
    if (confirm('❌ Удалить этот товар?')) {
        allProducts.splice(index, 1);
        saveToStorage();
        showStatus('success', '🗑️ Товар удален');
    }
}

// Сброс формы
function resetForm() {
    document.getElementById('add-product-form').reset();
    const submitBtn = document.querySelector('#add-product-form button[type="submit"]');
    submitBtn.textContent = '💾 СОХРАНИТЬ ТОВАР';
    submitBtn.onclick = null;
    document.getElementById('add-status').className = 'status';
}

// Отображение категорий
function displayCategories() {
    const container = document.getElementById('categories-list');
    let html = '<div style="display: flex; flex-wrap: wrap; gap: 10px;">';
    
    categories.forEach((cat, index) => {
        const productCount = allProducts.filter(p => p.categoryId === cat.id).length;
        
        html += `
            <div style="
                border: 1px solid #00ff00;
                padding: 10px;
                border-radius: 5px;
                background: rgba(0, 40, 0, 0.2);
                min-width: 200px;
            ">
                <div style="font-size: 1.5rem;">${cat.icon}</div>
                <div><strong>${cat.name}</strong></div>
                <div style="color: #888; font-size: 0.9rem;">${cat.description}</div>
                <div style="margin-top: 5px;">Товаров: ${productCount}</div>
                <div style="margin-top: 5px;">
                    <button class="action-btn edit-btn" onclick="editCategory(${index})">✏️</button>
                    <button class="action-btn delete-btn" onclick="deleteCategory(${index})" 
                            ${productCount > 0 ? 'disabled style="opacity:0.5"' : ''}>
                        🗑️
                    </button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Добавление категории
function addCategory() {
    const name = document.getElementById('new-category-name').value.trim();
    const icon = document.getElementById('new-category-icon').value.trim();
    const id = document.getElementById('new-category-id').value.trim().toLowerCase();
    
    if (!name || !icon || !id) {
        alert('Заполните все поля');
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
        description: 'Новая категория'
    });
    
    // Сохраняем
    saveToStorage();
    
    // Очищаем поля
    document.getElementById('new-category-name').value = '';
    document.getElementById('new-category-icon').value = '';
    document.getElementById('new-category-id').value = '';
    
    showStatus('success', '✅ Категория добавлена');
}

// Редактирование категории
function editCategory(index) {
    const newName = prompt('Новое название категории:', categories[index].name);
    const newIcon = prompt('Новая иконка (эмодзи):', categories[index].icon);
    const newDesc = prompt('Новое описание:', categories[index].description);
    
    if (newName) categories[index].name = newName;
    if (newIcon) categories[index].icon = newIcon;
    if (newDesc) categories[index].description = newDesc;
    
    saveToStorage();
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
        showStatus('success', '🗑️ Категория удалена');
    }
}

// Обновление информации экспорта
function updateExportInfo() {
    document.getElementById('total-products').textContent = allProducts.length;
    document.getElementById('data-status').textContent = 'Готово';
    document.getElementById('last-update-admin').textContent = new Date().toLocaleString('ru-RU');
}

// Экспорт в JSON
function exportToJSON() {
    const data = prepareDataForExport();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iglova_products_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showStatus('success', '📥 JSON файл скачан');
}

// Экспорт в CSV
function exportToCSV() {
    let csv = 'Номер;Цена;Отлет;Оператор;Категория;Описание\n';
    
    allProducts.forEach(product => {
        const category = categories.find(c => c.id === product.categoryId) || { name: '' };
        const row = [
            `"${product.number}"`,
            `"${product.price}"`,
            `"${product.months || '?'}"`,
            `"${product.operator || ''}"`,
            `"${category.name}"`,
            `"${product.description || ''}"`
        ].join(';');
        csv += row + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iglova_products_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showStatus('success', '📊 CSV файл скачан');
}

// Копирование в буфер обмена
function copyToClipboard() {
    const data = prepareDataForExport();
    const text = JSON.stringify(data, null, 2);
    
    navigator.clipboard.writeText(text).then(() => {
        showStatus('success', '📋 JSON скопирован в буфер обмена');
    }).catch(err => {
        showStatus('error', 'Ошибка копирования: ' + err);
    });
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
            showStatus('success', '✅ Данные успешно импортированы');
            
        } catch (error) {
            showStatus('error', '❌ Ошибка импорта: ' + error.message);
        }
    };
    
    reader.readAsText(file);
}

// Парсинг CSV
function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(';').map(h => h.replace(/"/g, '').trim());
    const products = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(';').map(v => v.replace(/^"|"$/g, '').trim());
        const product = {};
        
        headers.forEach((header, index) => {
            product[header.toLowerCase()] = values[index];
        });
        
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
                        categoryId: category.id
                    });
                });
            }
        });
    } else if (data.products && Array.isArray(data.products)) {
        // Если импортированы только товары
        allProducts = data.products.map(product => ({
            ...product,
            categoryId: product.categoryId || 'russian'
        }));
    }
    
    saveToStorage();
    updateUI();
}

// Обновление сайта (сохранение в products.json)
function updateWebsite() {
    const data = prepareDataForExport();
    const statusElement = document.getElementById('update-status');
    
    // В реальном проекте здесь был бы запрос к серверу
    // Для GitHub Pages мы эмулируем сохранение
    
    // Создаем виртуальный файл для скачивания
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products.json';
    a.textContent = '📥 Скачать обновленный products.json';
    
    statusElement.innerHTML = `
        <div class="status success">
            ✅ Данные подготовлены для обновления<br><br>
            <strong>Инструкция:</strong><br>
            1. Скачайте файл: <br>
            <div style="margin: 10px 0;">${a.outerHTML}</div>
            2. Замените файл <code>public/products.json</code> в GitHub<br>
            3. Сайт автоматически обновится в течение 5 минут
        </div>
    `;
    
    // Добавляем обработчик для ссылки
    setTimeout(() => {
        document.querySelector('#update-status a').addEventListener('click', function(e) {
            e.preventDefault();
            a.click();
        });
    }, 100);
}

// Создание бэкапа
function createBackup() {
    const backup = {
        timestamp: new Date().toISOString(),
        products: allProducts,
        categories: categories
    };
    
    localStorage.setItem(CONFIG.backupKey, JSON.stringify(backup));
    showStatus('success', '💾 Бэкап создан: ' + new Date().toLocaleString('ru-RU'));
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
            categories = backup.categories || [];
            saveToStorage();
            showStatus('success', '✅ Данные восстановлены из бэкапа');
        } catch (error) {
            showStatus('error', '❌ Ошибка восстановления: ' + error.message);
        }
    }
}

// Показать статус
function showStatus(type, message) {
    const statusElement = document.getElementById('add-status');
    statusElement.textContent = message;
    statusElement.className = `status ${type}`;
    
    setTimeout(() => {
        statusElement.className = 'status';
    }, 5000);
}
