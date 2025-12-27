import { TableLoader } from '/static/js/core/TableLoad.js';
import { getDispatcher } from "/static/js/core/dispatcher.js";
export class MenuPeriodBinder {

    constructor(selector) {
        this.selector = selector;
        this.initialized = false;
        this.dropdown = null;
    }

    activate(event) {
        // Активируем только один раз
        if (this.initialized) return;

        this.dropdown = document.querySelector(this.selector);
        if (!this.dropdown) {
            console.warn("MenuPeriodBinder: selector not found:", this.selector, 'dropdown: ',this.dropdown);
            return;
        }

        const dropdown = this.dropdown;

        const button = dropdown.querySelector('.dropdown-button');
        const hiddenInput = dropdown.querySelector('input[type="hidden"]');
        const items = dropdown.querySelectorAll('.dropdown-content a');

        if (!button || !hiddenInput || items.length === 0) {
            console.warn("MenuPeriodBinder: missing elements in dropdown:", dropdown);
            return;
        }

        // внутри activate, после проверки button/hiddenInput/items
        const dropdownContent = dropdown.querySelector('.dropdown-content');
        // открытие/закрытие меню
        button.addEventListener('click', () => {
            dropdownContent.classList.toggle('show');

            const caret = button.querySelector('.caret');
            if (caret) {
                const isOpen = dropdownContent.classList.contains('show');
                caret.classList.toggle('open', isOpen);
            }
        });

        this.initialized = true;

        const labelSpan = button.querySelector('.label');
        const url = dropdown.dataset.url;
        const targetId = dropdown.dataset.target;
        const actionName = dropdown.dataset.action;

        //console.log('MenuPeriodBinder: binding dropdown:', dropdown, 'items: ', items);

        items.forEach(item => {
            item.addEventListener('click', () => {
                const value = item.dataset.value || item.textContent.trim();
                const label = item.dataset.label || value;

                // Стандартное поведение
                hiddenInput.value = value;
                if (labelSpan) labelSpan.textContent = label;

                items.forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');

                // 🔥 ЗАКРЫВАЕМ МЕНЮ 
                dropdownContent.classList.remove('show');
                // 🔥 СБРАСЫВАЕМ КАРЕТКУ 
                const caret = button.querySelector('.caret');
                if (caret) caret.classList.remove('open');

                dropdown.dispatchEvent(new CustomEvent('menu-changed', {
                    bubbles: true,
                    detail: { value, label }
                }));

                //console.log('MenuPeriodBinder: menu-changed dispatched:', value, label);

                // Проверка на повторное значение
                if (dropdown.__lastValue === value) {
                    console.log(`MenuPeriodBinder: duplicate value (${value}) — skipped`);
                    return;
                }
                dropdown.__lastValue = value;

                // Вызов actionName
                if (actionName) {
                    const fn = window[actionName] || API?.[actionName];
                    if (typeof fn === 'function') {
                        fn(value, label, dropdown);
                    } else {
                        console.warn(`MenuPeriodBinder: handler '${actionName}' not found`);
                    }
                }

                // Загрузка данных
                if (targetId && url) {
                    TableLoader.load(url, targetId, { value });
                }
                const dispatcher = getDispatcher();
                dispatcher.dispatch("RootPage", { type: "Rebind" });
            });
        });
    }
}
