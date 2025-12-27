export class MenuRegionBinder {

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
            console.warn("MenuRegionBinder: selector not found:", this.selector);
            return;
        }

        const containers = this.zone.querySelectorAll('[data-role="menu-region"]');
        if (!containers.length) {
            console.warn("MenuRegionBinder: no containers found:", this.selector);
            return;
        }

        console.log("MenuRegionBinder: activated");

        containers.forEach(container => this._bindContainer(container));
    }

    _bindContainer(container) {
        if (container.__menu_region_bound) return;
        container.__menu_region_bound = true;

        container.addEventListener("click", (e) => {
            const target = e.target;

            // --- EDIT ---
            if (target.closest(".region-edit")) {
                e.stopPropagation();
                this.onEdit(container);
                return;
            }

            // --- SAVE ---
            if (target.closest(".region-save")) {
                e.stopPropagation();
                this.onSave(container, target.closest(".region-save"));
                return;
            }

            // --- CANCEL ---
            if (target.closest(".region-cancel")) {
                e.stopPropagation();
                this.onCancel(container);
                return;
            }

            // --- DROPDOWN BUTTON ---
            const btn = target.closest(".dropdown-button");
            if (btn) {
                e.stopPropagation();
                this.toggleDropdown(container, btn);
                return;
            }

            // --- ITEM SELECT ---
            const item = target.closest(".dropdown-content a");
            if (item) {
                e.preventDefault();
                e.stopPropagation();
                this.onSelect(container, item);
                return;
            }
        });
    }

    // ---------------------------------------------------------
    // ЛОГИКА
    // ---------------------------------------------------------

    onEdit(container) {
        const tpl = document.querySelector("#region-template");
        const slot = container.querySelector(".dropdown-content");

        if (tpl && slot && slot.children.length === 0) {
            slot.append(...tpl.cloneNode(true).children);
        }

        container.querySelector(".region-edit").style.display = "none";
        container.querySelector(".region-save").style.display = "inline-flex";
        container.querySelector(".region-cancel").style.display = "inline-flex";
        container.querySelector(".dropdown-button").style.display = "inline-flex";
    }

    onSave(container, btn) {
        const id = btn.dataset.id;
        const field = btn.dataset.field;
        const url = btn.dataset.url;

        const hiddenInput = container.querySelector("input[type='hidden']");
        const value = hiddenInput?.value;

        const slot = container.querySelector(".dropdown-content");
        if (slot) {
            slot.innerHTML = "";
            slot.classList.remove("show");
        }

        fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, field, value })
        })
            .then(r => r.json())
            .then(data => {
                console.log("Ответ сервера:", data);
                this.resetUI(container);
            })
            .catch(err => console.error("Ошибка сохранения:", err));

        this.resetUI(container);
    }

    onCancel(container) {
        const slot = container.querySelector(".dropdown-content");
        if (slot) {
            slot.innerHTML = "";
            slot.classList.remove("show");
        }

        const hiddenInput = container.querySelector("input[type='hidden']");
        if (hiddenInput) hiddenInput.value = "";

        this.resetUI(container);
    }

    toggleDropdown(container, btn) {
        const dropdown = container.querySelector(".dropdown-content");
        const caret = btn.querySelector(".caret");

        const isOpen = dropdown.classList.toggle("show");

        if (caret) {
            caret.classList.toggle("open", isOpen);
        }
    }

    onSelect(container, item) {
        const hiddenInput = container.querySelector("input[type='hidden']");
        const regionName = container.querySelector("#region_name");

        const value = item.dataset.value || item.textContent.trim();
        const label = item.dataset.label || value;

        if (hiddenInput) hiddenInput.value = value;
        if (regionName) regionName.textContent = label;

        container.querySelectorAll(".dropdown-content a")
            .forEach(i => i.classList.remove("selected"));
        item.classList.add("selected");

        container.querySelector(".dropdown-content")?.classList.remove("show");
        // 🔥 СБРАСЫВАЕМ КАРЕТКУ 
        const caret = container.querySelector(".dropdown-button .caret");
        if (caret) caret.classList.remove("open");
    }

    resetUI(container) {
        container.querySelector(".region-edit").style.display = "inline-flex";
        container.querySelector(".region-save").style.display = "none";
        container.querySelector(".region-cancel").style.display = "none";
        container.querySelector(".dropdown-button").style.display = "none";

        const dropdown = container.querySelector(".dropdown-content");
        if (dropdown) dropdown.classList.remove("show");

        const caret = container.querySelector(".dropdown-button .caret");
        if (caret) caret.classList.remove("open");
    }
}
