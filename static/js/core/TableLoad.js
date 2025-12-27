//import { BinderRegistry } from './binderRegistry.js';
import * as TabUtil from '/static/js/_aux/tabUtil.js';
import { getDispatcher } from "/static/js/core/dispatcher.js";

// Фрагменты скачиваютя через TabLoader !!!
// Здесь только мастер - таблица:
// нет необходимости в указании  первичного ключа orderNum


export const TableLoader = {
    async load(url, targetId, params = {}) {
        const target = document.getElementById(targetId);
        if (!target) return null;

        const dispatcher = getDispatcher();

        const { headers, body } = TabUtil.serializeParams(params);
        const res = await fetch(url, { method: "POST", headers, body });
        const html = await res.text();

        target.innerHTML = html;

        // 🔥 Определяем страницу, которой принадлежит этот target
        const pageName = dispatcher.findPageByZone(`#${targetId}`);

        if (pageName) {
            dispatcher.dispatch(pageName, { type: "Rebind" });
        }

        return html;
    }
};
