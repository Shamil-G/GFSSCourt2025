export class EditRowTableBinder {

    constructor(selector) {
        this.selector = selector;
        this.initialized = false;
    }

    activate(event) {
        if (this.initialized) return;
        this.initialized = true;

        const zone = document.querySelector(this.selector);
        if (!zone) {
            console.warn("EditRowTableBinder: selector not found:", this.selector);
            return;
        }

        const rows = zone.matches?.('[data-role~="edit-row"]')
            ? [zone]
            : Array.from(zone.querySelectorAll('[data-role~="edit-row"]'));

        console.log("EditRowTableBinder: activate. rows:", rows);

        rows.forEach(row => this._bindRow(row));
    }

    _bindRow(row) {
        if (row.__EditRowTableBinder) return;
        row.__EditRowTableBinder = true;

        console.log("EditRowTableBinder: bind row:", row);

        row.addEventListener("click", (e) => {
            const target = e.target;

            // игнорируем клики внутри меню регионов
            if (target.closest('div[data-role~="menu-region-edit"]')) return;

            // --- EDIT ---
            const editBtn = target.closest(".edit-btn");
            if (editBtn && row.contains(editBtn)) {
                e.stopPropagation();
                this._onEdit(editBtn);
                return;
            }

            // --- CANCEL ---
            const cancelBtn = target.closest(".cancel-btn");
            if (cancelBtn && row.contains(cancelBtn)) {
                e.stopPropagation();
                this._onCancel(cancelBtn);
                return;
            }

            // --- SAVE ---
            const saveBtn = target.closest(".save-btn");
            if (saveBtn && row.contains(saveBtn)) {
                e.stopPropagation();
                this._onSave(saveBtn);
                return;
            }
        });
    }

    // ---------------------------------------------------------
    // ЛОГИКА
    // ---------------------------------------------------------

    _onEdit(btn) {
        const id = btn.dataset.id;
        const field = btn.dataset.field;

        if (!id || !field) {
            console.warn("EditRowTableBinder: missing id or field");
            return;
        }

        this.startEdit(id, field);
    }

    _onCancel(btn) {
        const id = btn.dataset.id;
        const field = btn.dataset.field;

        if (!id || !field) {
            console.warn("EditRowTableBinder: missing id or field");
            return;
        }

        this.cancelEdit(id, field);
    }

    _onSave(btn) {
        const id = btn.dataset.id;
        const field = btn.dataset.field;

        if (!id || !field) {
            console.warn("EditRowTableBinder: missing id or field");
            return;
        }

        this.save(id, field);
    }

    // ---------------------------------------------------------
    // API
    // ---------------------------------------------------------

    startEdit(id, field) {
        const row = document.querySelector(`tr[data-order="${id}"]`);
        const input = row?.querySelector(`input[name="${field}"]`);
        if (!input) return;

        input.removeAttribute("readonly");
        input.classList.add("editing");

        row.querySelector(`.edit-btn[data-field="${field}"]`)?.style.setProperty("display", "none");
        row.querySelector(`.save-btn[data-field="${field}"]`)?.style.setProperty("display", "inline-block");
        row.querySelector(`.cancel-btn[data-field="${field}"]`)?.style.setProperty("display", "inline-block");
    }

    cancelEdit(id, field) {
        const row = document.querySelector(`tr[data-order="${id}"]`);
        const input = row?.querySelector(`input[name="${field}"]`);
        if (!input) return;

        input.setAttribute("readonly", true);
        input.classList.remove("editing");

        row.querySelector(`.edit-btn[data-field="${field}"]`)?.style.setProperty("display", "inline-block");
        row.querySelector(`.save-btn[data-field="${field}"]`)?.style.setProperty("display", "none");
        row.querySelector(`.cancel-btn[data-field="${field}"]`)?.style.setProperty("display", "none");
    }

    async save(id, field) {
        const row = document.querySelector(`tr[data-order="${id}"]`);
        const input = row?.querySelector(`input[name="${field}"]`);
        if (!input) return;

        const value = input.value;

        if (input.__lastValue === value) {
            console.log(`⚠️ EditRowTableBinder: save skipped — unchanged: ${value}`);
            return;
        }

        input.__lastValue = value;

        try {
            const res = await fetch(`/update-field`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, field, value })
            });

            if (!res.ok) {
                console.error(`❌ Failed to save ${field} for ${id}:`, res.status, await res.text());
                throw new Error(`Request failed with status ${res.status}`);
            }

            const result = await res.json();
            console.log(`✅ Saved ${field}=${value} for id=${id}:`, result);

            this.cancelEdit(id, field);
        } catch (err) {
            console.error(`❌ Failed to save ${field} for ${id}:`, err);
            alert("Error saving " + field);
        }
    }
}
