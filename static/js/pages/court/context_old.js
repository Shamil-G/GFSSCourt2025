import { MenuBinder } from '/static/js/pages/court/binders/menuBinder.js';
import { FilterActiveCloseRefundBinder } from '/static/js/pages/court/binders/filterActiveCloseRefundBinder.js';
import { FilterIinBinder } from '/static/js/pages/court/binders/filterIINBinder.js';
import { MenuRegionBinder } from '/static/js/pages/court/binders/menuRegionBinder.js';
import { MenuRegionEditBinder } from '/static/js/pages/court/binders/menuRegionEditBinder.js';
import { EditRowTableBinder } from '/static/js/pages/court/binders/editRowTableBinder.js';

import { MutualExclusiveBinder } from '/static/js/binders/standart/mutualExclusiveBinder.js';
import { RowClickBinder } from '/static/js/binders/standart/rowClickBinder.js';

import { TabSwitchBinder } from '/static/js/core/TabSwitchBinder.js';

//import { FragmentBinder } from '/static/js/core/TableLoad.js';
import { HelperBinder } from '/static/js/binders/standart/helperBinder.js';


export const courtTabContext = {
    graph: {
        root: "RootPage",
        pages: {
            RootPage: { subscribers: ["scammer", "pretrial", "law", "crime", "civ", "appeal", "execution", "refunding"] },
            scammer: { subscribers: ["scammer_edit", "scammer_show"] },
            scammer_edit: { subscribers: ["scammer_show"] },
            pretrial: { subscribers: ["pretrial_edit", "pretrial_show" ] },
            law: { subscribers: [] },
            crime: { subscribers: [] },
            civ: { subscribers: [] },
            appeal: { subscribers: [] },
            execution: { subscribers: [] },
            refunding: { subscribers: [] }
        }
    }

    zones: {
        mainTableHelper: '#court_mainTable',
        fragment: '#court_mainBody',
        filters: '#court_filterZone',
        tabs: '#court_tabs',
        tabs_content: '#court_tabs_content'
    },
    
    binders: {
        mainTableHelper: [HelperBinder],
        fragment: [EditRowTableBinder, RowClickBinder, MenuRegionEditBinder], //RowClickBinder, 
        filters: [FilterIinBinder, FilterActiveCloseRefundBinder, MenuBinder],
        tabs: [ TabSwitchBinder ],
        tabs_content: [MenuBinder, MutualExclusiveBinder]
    },

    request: {
        fragment: {
            method: 'POST',
            url: orderNum => `/filter-period-overpayments`
        },
        filters: {
            method: 'POST',
            url: '/court_filters',
            params: () => ({}) // 👈 пустой объект, если нет orderNum
        }
    },

    bindScope: {
        filters: 'global',    // искать в document, независимо от fragment
        fragment: 'global',     // искать только в загруженном фрагменте
        tabs: 'local',
        tabs_content: 'local'
    },

    loadStrategy: {
        fragment: 'eager',
        filters: 'eager',
        tabs: 'eager',
        tabs_content: 'eager'
    }
};

export default courtTabContext;