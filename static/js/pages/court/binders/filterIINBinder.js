import { TableLoader } from '/static/js/core/TableLoad.js';
import { getDispatcher } from "/static/js/core/dispatcher.js";
export class FilterIINBinder {

    constructor(selector) {
        this.selector = selector;
        this.initialized = false;
        this.zone = null;
    }

    activate(event) {
        // Активируем только один раз
        if (this.initialized) return;
        this.initialized = true;

        this.zone = document.querySelector(this.selector);
        if (!this.zone) {
            console.warn("FilterIINBinder: selector not found:", this.selector);
            return;
        }

        const triggers = this.zone.querySelectorAll('[data-role="filter-iin"]');
        if (!triggers.length) {
            console.warn("FilterIINBinder: no triggers found in zone:", this.selector);
            return;
        }

        console.log("FilterIINBinder: activated");

        triggers.forEach(el => this._bindElement(el));
    }

    _bindElement(el) {
        if (!el) return;
        if (el.__filter_iin) return;
        el.__filter_iin = true;

        const tag = el.tagName;

        console.log("FilterIINBinder: bindElement");

        // -----------------------------
        // INPUT — фильтрация по Enter
        // -----------------------------
        if (tag === 'INPUT') {
            const url = el.dataset.url;
            const targetId = el.dataset.target;

            if (!url || !targetId) {
                console.warn('FilterIINBinder: missing url or targetId on INPUT', el);
                return;
            }

            if (!el.__fragmentKeydownBound) {
                el.__fragmentKeydownBound = true;

                el.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        const value = el.value.trim();

                        console.log("FilterIINBinder: keydown");

                        if (value === el.__lastValue) return;
                        el.__lastValue = value;

                        TableLoader.load(url, targetId, { value });
                    }
                });
            }

            return;
        }

        // -----------------------------
        // BUTTON / A — фильтрация по клику
        // -----------------------------
        const isInteractive = ['BUTTON', 'A'].includes(tag);
        if (isInteractive) {
            const url = el.dataset.url;
            const targetId = el.dataset.target;
            const input = el.closest('td')?.querySelector('input');

            if (!url || !targetId || !input) {
                console.warn('FilterIINBinder: missing url, targetId, or input', el);
                return;
            }

            el.addEventListener('click', (event) => {
                event.preventDefault();

                const value = input.value.trim();
                if (value === input.__lastValue) return;
                input.__lastValue = value;

                TableLoader.load(url, targetId, { value });
                const dispatcher = getDispatcher();
                dispatcher.dispatch("RootPage", { type: "Rebind" });
            });
        }
    }
}
