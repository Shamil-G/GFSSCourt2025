// ----- Imports -----
import { initDispatcher } from "/static/js/core/dispatcher.js";
import * as TabUtil from '/static/js/_aux/tabUtil.js';

// ----- Helpers -----
function getPageName() {
    const el = document.getElementById('pageScript');
    return el?.dataset?.page || 'court';
}

function highlightMasterRow(orderNum) {
    const rows = document.querySelectorAll('table tbody tr[data-order]');
    rows.forEach(row => {
        row.classList.toggle('active-row', row.dataset.order === orderNum);
    });
}

function activateTabUI(tabName) {
    document.querySelectorAll('#court_tabs_content .tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.querySelectorAll('#court_tabs .tab').forEach(btn => {
        btn.classList.remove('active');
    });
    const activePanel = document.querySelector(`#court_tabs_content [data-tab="${tabName}"]`);
    const activeButton = document.querySelector(`#court_tabs .tab[data-tab="${tabName}"]`);
    if (activePanel) activePanel.classList.add('active');
    if (activeButton) activeButton.classList.add('active');
}

// ----- Bootstrapping -----
async function boot() {
    const pageName = getPageName(); // 'court' | 'new_court'
    const basePath = `/static/js/pages/${pageName}`;

    // 1) Динамически импортируем контекст страницы
    const { context } = await import(`${basePath}/context.js`);

    // 2) Создаём диспетчер событий
    const dispatcher = initDispatcher(context.graph);

    // 3) Первичное событие — запуск страницы
    dispatcher.dispatch(pageName, {
        type: "InitPage",
        payload: { page: pageName }
    });

    const hasTabsUI = !!(document.getElementById('court_tabs') && document.getElementById('court_tabs_content'));

    // ----- ЛОГИКА -----

    function loadTabContent(tabName, orderNum) {
        if (!orderNum || !hasTabsUI) return;

        const contentZone = TabUtil.getTargetZone(tabName);
        if (!contentZone) return;

        if (contentZone.dataset.loadedOrderNum === orderNum) return;

        TabUtil.showLoadingMessage(tabName);

        dispatcher.dispatch(tabName, {
            type: 'LoadFragment',
            payload: { orderNum, page: pageName }
        });

        contentZone.dataset.loadedOrderNum = orderNum;
    }

    function filterByOrder(orderNum) {
        if (!TabUtil.setSharedOrderNum(orderNum)) return;
        highlightMasterRow(orderNum);

        dispatcher.dispatch(pageName, {
            type: 'MasterRowSelected',
            payload: { orderNum, page: pageName }
        });

        if (hasTabsUI) {
            const tabName = TabUtil.getCurrentTabId();
            if (!TabUtil.loadFromCache(tabName, orderNum)) {
                dispatcher.dispatch(tabName, {
                    type: 'TabSwitch',
                    payload: { orderNum, page: pageName }
                });
            }
        }
    }

    function onTabSwitch(tabName) {
        if (!hasTabsUI) return;

        TabUtil.setSharedTabId(tabName);
        activateTabUI(tabName);

        const orderNum = TabUtil.getSharedOrderNum();

        dispatcher.dispatch(pageName, {
            type: 'TabChanged',
            payload: { tabName, orderNum, page: pageName }
        });

        dispatcher.dispatch(tabName, {
            type: 'TabSwitch',
            payload: { orderNum, page: pageName }
        });
    }

    function bindTabButtons() {
        if (!hasTabsUI) return;

        document.querySelectorAll('#court_tabs_content .refresh-btn[data-tab]').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;
                const orderNum = TabUtil.getSharedOrderNum();
                dispatcher.dispatch(tabName, { type: 'Refresh', payload: { orderNum, page: pageName } });
            });
        });

        document.querySelectorAll('#court_tabs_content [data-role="toggle-visible-form"][data-tab]').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;
                dispatcher.dispatch(tabName, { type: 'ToggleForm', payload: { page: pageName } });
            });
        });
    }

    // ----- DOM события -----

    document.querySelectorAll('#court_mainBody tr[data-order]').forEach(row => {
        row.addEventListener('click', () => filterByOrder(row.dataset.order));
    });

    if (hasTabsUI) {
        document.querySelectorAll('#court_tabs button[data-tab]').forEach(btn => {
            btn.addEventListener('click', () => onTabSwitch(btn.dataset.tab));
        });
        bindTabButtons();
    }

    // ----- Активируем дефолтную вкладку -----

    if (hasTabsUI) {
        const defaultTab = TabUtil.getCurrentTabId() || 'scammer';
        activateTabUI(defaultTab);

        const orderNum = TabUtil.getSharedOrderNum();
        if (orderNum) {
            dispatcher.dispatch(defaultTab, {
                type: 'TabSwitch',
                payload: { orderNum, page: pageName }
            });
        }
    }
}

// Старт
document.addEventListener('DOMContentLoaded', boot);
