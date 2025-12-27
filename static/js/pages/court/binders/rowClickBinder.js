import * as TabUtil from '/static/js/_aux/tabUtil.js';
import { getDispatcher } from "/static/js/core/dispatcher.js";


export class RowClickBinder {

    constructor(selector) {
        this.selector = selector;
        this.initialized = false;
    }

    activate(event) {
        const zone = document.querySelector(this.selector);
        if (!zone) return;

        if (this.initialized) return;
        this.initialized = true;

        const containers = zone.matches?.('[data-role~="row-click"]')
            ? [zone]
            : Array.from(zone.querySelectorAll('[data-role~="row-click"]'));

        containers.forEach(c => this._bindContainer(c));
    }

    _bindContainer(container) {
        if (container.__RowClickBinder) return;
        container.__RowClickBinder = true;

        const actionName = container.dataset.action;

        container.addEventListener("click", (e) => {
            const tag = e.target.tagName;
            const ignore = ["INPUT", "BUTTON", "SELECT", "TEXTAREA", "LABEL"];
            if (ignore.includes(tag)) return;

            const row = e.target.closest(".clickable-row");
            if (!row || !container.contains(row)) return;

            const orderNum = row.dataset.order;
            if (!orderNum || !actionName) return;

            TabUtil.setSharedOrderNum(orderNum);

            // 🔥 Подсветка выбранной строки 
            container.querySelectorAll('.clickable-row').forEach(r => r.classList.remove('selected-row'));
            row.classList.add('selected-row');

            const dispatcher = getDispatcher();
            dispatcher.dispatch("RootPage", { type: "ChangeOrderNum" });
        });
    }
}
