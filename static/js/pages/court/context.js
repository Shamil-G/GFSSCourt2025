import { FilterActiveCloseRefundBinder } from '/static/js/pages/court/binders/filterActiveCloseRefundBinder.js';
import { FilterIINBinder } from '/static/js/pages/court/binders/filterIINBinder.js';
import { MenuRegionBinder } from '/static/js/pages/court/binders/menuRegionBinder.js';
import { MenuPeriodBinder } from '/static/js/pages/court/binders/menuPeriodBinder.js';
import { EditRowTableBinder } from '/static/js/pages/court/binders/editRowTableBinder.js';
import { RowClickBinder } from '/static/js/pages/court/binders/rowClickBinder.js';

//console.log("FilterIINBinder =", FilterIINBinder);
//console.log("FilterActiveCloseRefundBinder =", FilterActiveCloseRefundBinder);
//console.log("MenuPeriodBinder =", MenuPeriodBinder);
//console.log("MenuRegionBinder =", MenuRegionBinder);

export const context = {
    graph: {
        pages: {

            // ---------------- Court ----------------
            court: {
                subscribers: ["court"],
                zones: {
                    filter_iin: "#filter-iin-zone",
                    filter_ac: "#filter-active-close-zone",
                    filter_period: "#filter-period"

                },
                binders: {
                    filter_iin: [FilterIINBinder],
                    filter_ac: [FilterActiveCloseRefundBinder],
                    filter_period: [MenuPeriodBinder]
                }
            },

            // ---------------- RootPage ----------------
            RootPage: {
                subscribers: [
                    "scammer", "pretrial", "law", "crime",
                    "civ", "appeal", "execution", "refunding"
                ],
                zones: {
                    fragment: "#court_mainBody",
                    tabs: "#court_tabs",
                    tabs_content: "#court_tabs_content"
                },
                binders: {
                    fragment: [MenuRegionBinder, EditRowTableBinder, RowClickBinder],
                    tabs_content: []
                },
                request: {
                    fragment: {
                        method: "POST",
                        url: "/root_fragment"
                    }
                }
            },

            // ---------------- Scammer ----------------
            scammer: {
                subscribers: ["scammer_edit", "scammer_show"],
                zones: {
                    form: "#scammerFormContainer",
                    content: "#scammerContent"
                },
                request: {
                    content: {
                        method: "POST",
                        url: "/scammer_fragment"
                    }
                }
            },

            scammer_edit: {
                subscribers: ["scammer_show"],
                zones: { fragment: "#scammerFormContainer" },
                request: { fragment: { method: "POST", url: "/scammer_edit" } }
            },

            scammer_show: {
                subscribers: [],
                zones: { fragment: "#scammerContent" },
                request: { fragment: { method: "POST", url: "/scammer_show" } }
            },

            // ---------------- Pretrial ----------------
            pretrial: {
                subscribers: ["pretrial_edit", "pretrial_show"],
                zones: {
                    form: "#pretrialFormContainer",
                    content: "#pretrialContent"
                },
                request: {
                    content: {
                        method: "POST",
                        url: "/pretrial_fragment"
                    }
                }
            },

            pretrial_edit: {
                subscribers: ["pretrial_show"],
                zones: { fragment: "#pretrialFormContainer" },
                request: { fragment: { method: "POST", url: "/pretrial_edit" } }
            },

            pretrial_show: {
                subscribers: [],
                zones: { fragment: "#pretrialContent" },
                request: { fragment: { method: "POST", url: "/pretrial_show" } }
            },

            // ---------------- Law ----------------
            law: {
                subscribers: ["law_edit", "law_show"],
                zones: {
                    form: "#lawFormContainer",
                    content: "#lawContent"
                },
                request: {
                    content: {
                        method: "POST",
                        url: "/law_fragment"
                    }
                }
            },

            law_edit: {
                subscribers: ["law_show"],
                zones: { fragment: "#lawFormContainer" },
                request: { fragment: { method: "POST", url: "/law_edit" } }
            },

            law_show: {
                subscribers: [],
                zones: { fragment: "#lawContent" },
                request: { fragment: { method: "POST", url: "/law_show" } }
            },

            // ---------------- Crime ----------------
            crime: {
                subscribers: ["crime_edit", "crime_show"],
                zones: {
                    form: "#crimeFormContainer",
                    content: "#crimeContent"
                },
                request: {
                    content: {
                        method: "POST",
                        url: "/crime_fragment"
                    }
                }
            },

            crime_edit: {
                subscribers: ["crime_show"],
                zones: { fragment: "#crimeFormContainer" },
                request: { fragment: { method: "POST", url: "/crime_edit" } }
            },

            crime_show: {
                subscribers: [],
                zones: { fragment: "#crimeContent" },
                request: { fragment: { method: "POST", url: "/crime_show" } }
            },

            // ---------------- Civ ----------------
            civ: {
                subscribers: ["civ_edit", "civ_show"],
                zones: {
                    form: "#civFormContainer",
                    content: "#civContent"
                },
                request: {
                    content: {
                        method: "POST",
                        url: "/civ_fragment"
                    }
                }
            },

            civ_edit: {
                subscribers: ["civ_show"],
                zones: { fragment: "#civFormContainer" },
                request: { fragment: { method: "POST", url: "/civ_edit" } }
            },

            civ_show: {
                subscribers: [],
                zones: { fragment: "#civContent" },
                request: { fragment: { method: "POST", url: "/civ_show" } }
            },

            // ---------------- Appeal ----------------
            appeal: {
                subscribers: ["appeal_edit", "appeal_show"],
                zones: {
                    form: "#appealFormContainer",
                    content: "#appealContent"
                },
                request: {
                    content: {
                        method: "POST",
                        url: "/appeal_fragment"
                    }
                }
            },

            appeal_edit: {
                subscribers: ["appeal_show"],
                zones: { fragment: "#appealFormContainer" },
                request: { fragment: { method: "POST", url: "/appeal_edit" } }
            },

            appeal_show: {
                subscribers: [],
                zones: { fragment: "#appealContent" },
                request: { fragment: { method: "POST", url: "/appeal_show" } }
            },

            // ---------------- Execution ----------------
            execution: {
                subscribers: ["execution_edit", "execution_show"],
                zones: {
                    form: "#executionFormContainer",
                    content: "#executionContent"
                },
                request: {
                    content: {
                        method: "POST",
                        url: "/execution_fragment"
                    }
                }
            },

            execution_edit: {
                subscribers: ["execution_show"],
                zones: { fragment: "#executionFormContainer" },
                request: { fragment: { method: "POST", url: "/execution_edit" } }
            },

            execution_show: {
                subscribers: [],
                zones: { fragment: "#executionContent" },
                request: { fragment: { method: "POST", url: "/execution_show" } }
            },

            // ---------------- Refunding ----------------
            refunding: {
                subscribers: ["refunding_show"],
                zones: {
                    content: "#refundingContent"
                },
                request: {
                    content: {
                        method: "POST",
                        url: "/refunding_fragment"
                    }
                }
            },

            refunding_show: {
                subscribers: [],
                zones: { fragment: "#refundingContent" },
                request: { fragment: { method: "POST", url: "/refunding_show" } }
            }

        } // ← закрываем pages
    }   // ← закрываем graph
};     // ← закрываем context
