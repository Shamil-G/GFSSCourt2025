// /static/js/core/EventDispatcher.js

class EventDispatcher {
    constructor(graph) {
        this.graph = graph;
        this.visited = new Set();
    }

    /**
     * Основной метод отправки события
     */
    dispatch(startPage, event) {
        this.visited.clear();
        this._propagate(startPage, event);
    }

    /**
     * Рекурсивная передача события подписчикам
     */
    _propagate(pageName, event) {
        if (this.visited.has(pageName)) return;
        this.visited.add(pageName);

        const page = this.graph.pages[pageName];
        if (!page) return;

        this._handlePageEvent(pageName, page, event);

        const subs = page.subscribers || [];
        for (const sub of subs) {
            this._propagate(sub, event);
        }
    }

    /**
     * Обработка события на странице
     */
    _handlePageEvent(pageName, page, event) {
        console.log(`Page ${pageName} received event ${event.type}`);

        // Активировать биндеры
        if (page.binders) {
            for (const [zoneName, binderList] of Object.entries(page.binders)) {
                const zoneSelector = page.zones?.[zoneName];
                if (!zoneSelector) continue;

                binderList.forEach(BinderClass => {
                    const binder = new BinderClass(zoneSelector);
                    binder.activate(event);
                });
            }
        }

        // Загрузка фрагмента
        if (page.request?.fragment && event.type === "LoadFragment") {
            const req = page.request.fragment;

            fetch(typeof req.url === "function" ? req.url(event.payload) : req.url, {
                method: req.method
            })
                .then(resp => resp.text())
                .then(html => {
                    const container = document.querySelector(page.zones.fragment);
                    container.innerHTML = html;

                    // После загрузки фрагмента — Rebind
                    this.dispatch(pageName, { type: "Rebind" });
                });
        }
    }

    /**
     * Поиск страницы по селектору зоны
     */
    findPageByZone(zoneSelector) {
        for (const [pageName, page] of Object.entries(this.graph.pages)) {
            for (const [zoneName, selector] of Object.entries(page.zones || {})) {
                if (selector === zoneSelector) {
                    return pageName;
                }
            }
        }
        return null;
    }
}

export { EventDispatcher };
