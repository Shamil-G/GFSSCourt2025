import { TableLoader } from '/static/js/core/TableLoad.js';
import { getDispatcher } from "/static/js/core/dispatcher.js";

import * as TabUtil from '/static/js/_aux/tabUtil.js';

export class FilterActiveCloseRefundBinder {

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
            console.warn("FilterActiveCloseRefundBinder: selector not found:", this.selector);
            return;
        }

        const toggles = this.zone.querySelectorAll('[data-role="filter-active-close"]');
        if (!toggles.length) {
            console.warn("FilterActiveCloseRefundBinder: no toggles found in zone:", this.selector);
            return;
        }

        console.log("FilterActiveCloseRefundBinder: activated");

        toggles.forEach(el => this._bindElement(el));
    }

    _bindElement(el) {
        if (!el) return;
        if (el.__filter_active_close) return;
        el.__filter_active_close = true;

        const url = el.dataset.url;
        const targetId = el.dataset.target;

        console.log("FilterActiveCloseRefundBinder: bindElement");

        if (!url || !targetId) {
            console.warn('FilterActiveCloseRefundBinder: missing url or targetId', el);
            return;
        }

        const input =
            el.querySelector('input[type="hidden"]') ||
            el.closest('td')?.querySelector('input[type="hidden"]');

        const icon =
            el.querySelector('.icon') ||
            el.querySelector('span') ||
            el;

        const iconActive = el.dataset.iconActive || '🟡';
        const iconClosed = el.dataset.iconClosed || '✅';

        if (!input || !icon) {
            console.warn('FilterActiveCloseRefundBinder: missing input or icon', el);
            return;
        }

        if (el.__fragmentToggleBound) return;
        el.__fragmentToggleBound = true;

        el.addEventListener('click', (event) => {
            event.preventDefault();

            const current = input.value;
            const next = current === 'active' ? 'closed' : 'active';

            input.value = next;
            icon.textContent = next === 'active' ? iconActive : iconClosed;

            console.log("FilterActiveCloseRefundBinder: toggled →", next);
            TableLoader.load(url, targetId, { value: next });
            const dispatcher = getDispatcher();
            dispatcher.dispatch("RootPage", { type: "Rebind" });
        });
    }
}
