/* T.01 grade calculator — totals, persistent record, stats, CSV export. */
(function () {
    "use strict";

    var DEFAULT_DENOMS = [
        { id: "d1", label: "Full answer", value: 1, key: "e" },
        { id: "d2", label: "Half point", value: 0.5, key: "w" },
        { id: "d3", label: "Quarter point", value: 0.25, key: "q" }
    ];
    var LS_KEY = "lgh-grade-calc-v2";

    var state = { total: 0, scale: 20, denoms: DEFAULT_DENOMS.slice(), entries: [] };
    try {
        var saved = JSON.parse(localStorage.getItem(LS_KEY) || "null");
        if (saved && Array.isArray(saved.denoms) && saved.denoms.length) state.denoms = saved.denoms;
        if (saved && Array.isArray(saved.entries)) state.entries = saved.entries.filter(function (n) { return isFinite(n); });
        if (saved && isFinite(saved.scale) && saved.scale > 0) state.scale = saved.scale;
    } catch (e) { /* ignore */ }

    function persist() {
        try { localStorage.setItem(LS_KEY, JSON.stringify({ denoms: state.denoms, entries: state.entries, scale: state.scale })); } catch (e) { /* ignore */ }
    }

    var $ = function (id) { return document.getElementById(id); };
    var totalEl = $("total"), fillEl = $("total-fill"), scaleHint = $("scale-hint"),
        denomsEl = $("denoms"), entriesEl = $("entries"), emptyMsg = $("empty-msg"),
        countPill = $("count-pill"), useKeys = $("use-keys"), scaleInput = $("scale"),
        exportHint = $("export-hint");

    var r2 = function (n) { return Math.round(n * 100) / 100; };

    function renderTotal() {
        totalEl.textContent = r2(state.total);
        var pct = state.scale > 0 ? Math.max(0, Math.min(100, (state.total / state.scale) * 100)) : 0;
        fillEl.style.width = pct + "%";
        scaleHint.textContent = "scale: / " + state.scale;
    }

    function renderDenoms() {
        denomsEl.innerHTML = "";
        state.denoms.forEach(function (d) {
            var row = document.createElement("div");
            row.className = "denom";
            row.innerHTML =
                '<input type="text" class="d-label" value="" aria-label="Label">' +
                '<input type="number" class="d-val" step="0.25" aria-label="Value">' +
                '<input type="text" class="d-key key-chip" maxlength="1" aria-label="Hotkey">' +
                '<button type="button" class="icon-btn add" title="Add to total">+</button>' +
                '<button type="button" class="icon-btn del" title="Remove quick mark">×</button>';
            var label = row.querySelector(".d-label"), val = row.querySelector(".d-val"), key = row.querySelector(".d-key");
            label.value = d.label; val.value = d.value; key.value = d.key;
            label.addEventListener("change", function () { d.label = label.value || "mark"; persist(); });
            val.addEventListener("change", function () { d.value = parseFloat(val.value) || 0; persist(); });
            key.addEventListener("change", function () { d.key = (key.value || "").toLowerCase().slice(0, 1); key.value = d.key; persist(); });
            row.querySelector(".add").addEventListener("click", function () { add(d.value); });
            row.querySelector(".del").addEventListener("click", function () {
                state.denoms = state.denoms.filter(function (x) { return x.id !== d.id; });
                persist(); renderDenoms();
            });
            denomsEl.appendChild(row);
        });
    }

    function statsOf(arr) {
        if (!arr.length) return null;
        var sorted = arr.slice().sort(function (a, b) { return a - b; });
        var sum = arr.reduce(function (a, b) { return a + b; }, 0);
        var mean = sum / arr.length;
        var mid = Math.floor(sorted.length / 2);
        var median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
        var variance = arr.reduce(function (a, b) { return a + (b - mean) * (b - mean); }, 0) / arr.length;
        return { mean: mean, median: median, min: sorted[0], max: sorted[sorted.length - 1], std: Math.sqrt(variance), count: arr.length };
    }

    function renderEntries() {
        entriesEl.innerHTML = "";
        state.entries.forEach(function (v, i) {
            var li = document.createElement("li");
            var left = document.createElement("span");
            left.innerHTML = '<span class="idx">#' + (i + 1) + "</span>";
            var val = document.createElement("span");
            val.className = "val"; val.textContent = r2(v);
            left.appendChild(val);
            var del = document.createElement("button");
            del.type = "button"; del.textContent = "×"; del.title = "Delete entry #" + (i + 1);
            del.setAttribute("aria-label", "Delete entry " + (i + 1));
            del.addEventListener("click", function () {
                state.entries.splice(i, 1); persist(); renderEntries();
            });
            li.appendChild(left); li.appendChild(del);
            entriesEl.appendChild(li);
        });
        emptyMsg.style.display = state.entries.length ? "none" : "block";
        countPill.textContent = String(state.entries.length);

        var s = statsOf(state.entries);
        $("st-mean").textContent = s ? r2(s.mean) : "–";
        $("st-median").textContent = s ? r2(s.median) : "–";
        $("st-min").textContent = s ? r2(s.min) : "–";
        $("st-max").textContent = s ? r2(s.max) : "–";
        $("st-std").textContent = s ? r2(s.std) : "–";
        $("st-count").textContent = s ? s.count : "0";
    }

    function add(n) {
        if (!isFinite(n)) return;
        state.total = r2(state.total + n);
        renderTotal();
    }

    function record() {
        state.entries.unshift(r2(state.total));
        state.total = 0;
        persist(); renderTotal(); renderEntries();
    }

    $("btn-record").addEventListener("click", record);
    $("btn-reset-total").addEventListener("click", function () { state.total = 0; renderTotal(); });
    $("btn-custom-add").addEventListener("click", function () { add(parseFloat($("custom-amount").value)); });
    $("btn-custom-sub").addEventListener("click", function () { add(-parseFloat($("custom-amount").value)); });
    $("btn-add-denom").addEventListener("click", function () {
        state.denoms.push({ id: "d" + Date.now(), label: "New mark", value: 1, key: "" });
        persist(); renderDenoms();
    });
    $("btn-undo").addEventListener("click", function () {
        if (!state.entries.length) return;
        state.total = r2(state.entries.shift());
        persist(); renderTotal(); renderEntries();
    });
    $("btn-clear").addEventListener("click", function () {
        if (!state.entries.length || window.confirm("Delete all " + state.entries.length + " recorded grades?")) {
            state.entries = []; persist(); renderEntries();
        }
    });
    scaleInput.value = state.scale;
    scaleInput.addEventListener("change", function () {
        var v = parseFloat(scaleInput.value);
        if (isFinite(v) && v > 0) { state.scale = v; persist(); renderTotal(); }
    });

    $("btn-csv").addEventListener("click", function () {
        if (!state.entries.length) { exportHint.textContent = "nothing to export yet."; return; }
        var csv = "index,grade\n" + state.entries.map(function (v, i) { return (i + 1) + "," + v; }).join("\n") + "\n";
        var a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
        a.download = "grades.csv";
        document.body.appendChild(a); a.click();
        window.setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
        exportHint.textContent = "grades.csv downloaded.";
    });
    $("btn-copy").addEventListener("click", function () {
        var s = statsOf(state.entries);
        var txt = s
            ? "grades: " + state.entries.map(r2).join(", ") + " | n=" + s.count + " mean=" + r2(s.mean) + " median=" + r2(s.median) + " min=" + r2(s.min) + " max=" + r2(s.max)
            : "no grades recorded.";
        function ok(done) { exportHint.textContent = done ? "summary copied." : txt; }
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { ok(true); }, function () { ok(false); });
        else ok(false);
    });

    function typingInField() {
        var el = document.activeElement;
        return el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
    }

    document.addEventListener("keydown", function (event) {
        if (!useKeys.checked || typingInField()) return;
        if (event.key === " ") { event.preventDefault(); record(); return; }
        if (event.key === "Backspace") {
            event.preventDefault();
            if (state.entries.length) { state.entries.shift(); persist(); renderEntries(); }
            return;
        }
        var k = event.key.toLowerCase();
        state.denoms.forEach(function (d) {
            if (d.key && d.key === k) add(d.value);
        });
    });

    renderTotal(); renderDenoms(); renderEntries();
})();
