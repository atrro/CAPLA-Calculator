const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");

const html = readFileSync(join(__dirname, "../index.html"), "utf8");

function extract(start, end) {
  const first = html.indexOf(start);
  const last = html.indexOf(end, first);
  assert.ok(first >= 0 && last > first, `Missing application code: ${start}`);
  return html.slice(first, last);
}

const code = [
  extract("function H9(", "const qr="),
  extract("const qr=", "var LSe="),
  extract("function EBe(", "function kBe("),
  extract("function cre(", "var OBe="),
].join("\n");

function harness() {
  const states = [];
  const dependencies = [];
  const effects = [];
  let cursor = 0;
  const context = {
    console,
    ss: () => {},
    M1e: () => [],
    WJ: () => [],
    hr: (...values) => values.filter(Boolean).join(" "),
    w: {
      jsx: (type, props, key) => ({ type, props, key }),
      jsxs: (type, props, key) => ({ type, props, key }),
    },
    L: {
      useState(initial) {
        const index = cursor++;
        if (!(index in states)) states[index] = typeof initial === "function" ? initial() : initial;
        return [states[index], value => {
          states[index] = typeof value === "function" ? value(states[index]) : value;
        }];
      },
      useMemo: fn => fn(),
      useEffect(fn, next) {
        const index = cursor++;
        if (!dependencies[index] || next.some((value, i) => value !== dependencies[index][i])) {
          dependencies[index] = next;
          effects.push(fn);
        }
      },
    },
  };
  for (const [, name] of code.matchAll(/w\.jsx[s]?\(([\w$]+),/g)) context[name] = name;
  vm.createContext(context);
  vm.runInContext(code + "\nglobalThis.api={ISe,DSe,EBe,FBe,cre,_Be};", context);
  return {
    api: context.api,
    render(component, props) {
      cursor = 0;
      return context.api[component](props);
    },
    async flush() {
      for (const effect of effects.splice(0)) effect();
      await new Promise(resolve => setImmediate(resolve));
    },
    capturePdf() {
      vm.runInContext("TBe=async report=>{globalThis.report=report};", context);
    },
    report: () => context.report,
  };
}

function nodes(tree) {
  if (!tree || typeof tree !== "object") return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}

function text(tree) {
  if (tree == null || tree === false) return "";
  if (Array.isArray(tree)) return tree.map(text).join("");
  return typeof tree === "object" ? text(tree.props?.children) : String(tree);
}

function fixture(id, site, vestas, sub) {
  return {
    id,
    name: `Scenario ${id.toUpperCase()}`,
    updatedAt: "2026-10-28T00:00:00Z",
    generalParams: { absence: id === "c" ? "37" : "6" },
    specialParams: { dtrSpecialTask: id === "c" ? "83" : "68" },
    editedCAPLASite: [{ state: "RN", site, caplaVestas: vestas, caplaSubcontractor: sub }],
    editedCAPLAST: [{ state: "RN", caplaVestas: vestas / 10, caplaSubcontractor: sub / 10 }],
  };
}

const analyses = [
  fixture("a", "Shared", 10, 2),
  fixture("b", "Shared", 20, 4),
  fixture("c", "Only C", 33.3, 6),
  fixture("d", "Unused", 40, 8),
];

test("selection accepts two or three scenarios, disables a fourth, and allows deselection", () => {
  const h = harness();
  const props = { analyses, name: "Test", folder: "" };
  const render = () => h.render("cre", props);
  const checkboxes = () => nodes(render()).filter(node => node.props?.onCheckedChange);
  const openButton = () => nodes(render()).find(node => text(node) === "Open comparison");
  assert.equal(openButton().props.disabled, true);
  checkboxes()[0].props.onCheckedChange();
  assert.equal(openButton().props.disabled, true);
  checkboxes()[1].props.onCheckedChange();
  assert.equal(openButton().props.disabled, false);
  checkboxes()[2].props.onCheckedChange();
  assert.match(text(render()), /Compare \(3\/3\)/);
  assert.equal(checkboxes()[3].props.disabled, true);
  checkboxes()[3].props.onCheckedChange();
  assert.equal(checkboxes().filter(node => node.props.checked).length, 3);
  checkboxes()[1].props.onCheckedChange();
  assert.equal(checkboxes()[3].props.disabled, false);
  checkboxes()[3].props.onCheckedChange();
  assert.equal(checkboxes().filter(node => node.props.checked).length, 3);
});

test("removed analyses do not consume selection slots or enable an invalid comparison", () => {
  const h = harness();
  const props = { analyses, name: "Test", folder: "" };
  let tree = h.render("cre", props);
  for (let i = 0; i < 3; i++) {
    nodes(tree).filter(node => node.props?.onCheckedChange)[i].props.onCheckedChange();
    tree = h.render("cre", props);
  }
  props.analyses = [analyses[0], analyses[3]];
  tree = h.render("cre", props);
  assert.match(text(tree), /Compare \(1\/3\)/);
  assert.equal(nodes(tree).find(node => text(node) === "Open comparison").props.disabled, true);
  nodes(tree).filter(node => node.props?.onCheckedChange)[1].props.onCheckedChange();
  tree = h.render("cre", props);
  assert.match(text(tree), /Compare \(2\/3\)/);
});

test("all three scenarios contribute sites, clusters, Special Tasks and regional totals", () => {
  const { ISe, DSe } = harness().api;
  const rows = ISe(...analyses.slice(0, 2), new Map(), new Map(),
    analyses[2], new Map([["Only C", "Third cluster"]]));
  const thirdOnly = rows.find(row => row.site === "Only C");
  assert.equal(thirdOnly.c.v, 33.3);
  assert.equal(thirdOnly.a, undefined);
  assert.equal(thirdOnly.cluster, "Third cluster");
  assert.ok(Math.abs(rows.find(row => row.site === "Special Task").c.v - 3.33) < 1e-10);
  for (const level of ["site", "state", "cluster", "region"]) {
    const grouped = DSe(rows, level);
    assert.ok(grouped.some(row => row.c?.v > 0), level);
  }
  const regional = DSe(rows.filter(row => row.site !== "Special Task"), "region");
  assert.equal(regional[0].a.v, 10);
  assert.equal(regional[0].b.v, 20);
  assert.equal(regional[0].c.v, 33.3);
});

test("comparison modal shows three scenario columns and exposes PDF export", () => {
  const h = harness();
  const tree = h.render("_Be", { analyses: analyses.slice(0, 3), open: true });
  assert.ok(nodes(tree).some(node => text(node) === "Export PDF"));
  const headers = nodes(tree).filter(node => node.type === "cs").map(text);
  assert.ok(headers.includes("Scenario C"));
  assert.ok(headers.includes("Scenario C Vestas / Sub."));
  assert.ok(nodes(tree).some(node => text(node) === "33.3 / 6.0"));
  assert.equal(h.render("_Be", { analyses: [analyses[0]] }), null);
  assert.equal(h.render("_Be", { analyses }), null);
});

for (const count of [2, 3]) {
  test(`PDF preview exports ${count} scenarios with matching column counts and totals`, async () => {
    const h = harness();
    const props = { left: analyses[0], right: analyses[1], third: count === 3 ? analyses[2] : undefined };
    let tree = h.render("FBe", props);
    assert.equal(nodes(tree).find(node => node.props?.onClick && text(node) === "Export PDF").props.disabled, true);
    await h.flush();
    tree = h.render("FBe", props);
    h.capturePdf();
    await nodes(tree).find(node => node.props?.onClick && text(node) === "Export PDF").props.onClick();
    const report = h.report();
    const pdf = h.api.EBe(report);
    const general = pdf.tables.find(table => table.title === "General Parameters");
    assert.equal(general.headers.length, count + 1);
    assert.equal(general.rows[0].length, count + 1);
    if (count === 3) {
      assert.equal(general.headers[3], "Scenario C");
      assert.equal(general.rows[0][3], "37%");
      assert.equal(pdf.tables[1].rows[0][3], "83%");
      assert.ok(report.results.headers.includes("Scenario C Vestas"));
      assert.ok(report.results.rows.some(row => row.includes("33,3")));
      assert.ok(report.results.totals.includes("36,6"));
      assert.match(report.subtitle, /Scenario C/);
    } else {
      assert.ok(!report.results.headers.includes("Scenario C Vestas"));
      assert.equal(report.results.headers.length, 8);
    }
    for (const table of pdf.tables) {
      assert.equal(table.align.length, table.headers.length);
      for (const row of table.rows) assert.equal(row.length, table.headers.length);
      if (table.totals) assert.equal(table.totals.length, table.headers.length);
    }
  });
}

test("third-scenario edits, differences, filters and reset reach the exported PDF", async () => {
  const h = harness();
  const props = { left: analyses[0], right: analyses[1], third: analyses[2] };
  const render = () => h.render("FBe", props);
  render();
  await h.flush();
  let tree = render();
  const input = nodes(tree).find(node => node.props?.value === "37%");
  input.props.onChange({ target: { value: "41%" } });
  const diff = nodes(tree).find(node => node.props?.value === "AB" && node.props.onValueChange);
  diff.props.onValueChange("CA");
  tree = render();
  const thirdValue = nodes(tree).find(node => node.props?.value === "33,3" && node.props.onChange);
  thirdValue.props.onChange({ target: { value: "43,3" } });
  tree = render();
  h.capturePdf();
  const exportPdf = async () => {
    await nodes(render()).find(node => node.props?.onClick && text(node) === "Export PDF").props.onClick();
    return h.report();
  };
  let report = await exportPdf();
  assert.equal(report.paramTables[0].rows[0].values[2], "41%");
  const row = report.results.rows.find(row => row.includes("Only C"));
  assert.equal(row.at(-2), "43,3");
  assert.match(report.results.note, /Scenario C - Scenario A/);
  const sites = nodes(tree).find(node => node.props?.label === "Sites");
  sites.props.onChange(new Set(["Only C"]));
  report = await exportPdf();
  assert.ok(!report.results.rows.some(row => row.includes("Only C")));
  nodes(render()).find(node => node.props?.onClick && text(node).includes("Reset edits")).props.onClick();
  report = await exportPdf();
  assert.equal(report.paramTables[0].rows[0].values[2], "37%");
});

test("Only differences retains rows changed exclusively in the third scenario", async () => {
  const h = harness();
  const props = {
    left: fixture("a", "Shared", 10, 2),
    right: fixture("b", "Shared", 10, 2),
    third: fixture("c", "Shared", 12, 2),
  };
  const render = () => h.render("FBe", props);
  render();
  await h.flush();
  const label = nodes(render()).find(node => node.type === "label" && text(node) === "Only differences");
  nodes(label).find(node => node.props?.onCheckedChange).props.onCheckedChange(true);
  h.capturePdf();
  await nodes(render()).find(node => node.props?.onClick && text(node) === "Export PDF").props.onClick();
  const report = h.report();
  assert.ok(report.paramTables[0].rows.some(row => row.values[2] === "37%"));
  assert.ok(report.results.rows.some(row => row.includes("Shared")));
});

test("reversed two-scenario differences and editable third names are exported correctly", async () => {
  for (const third of [undefined, analyses[2]]) {
    const h = harness();
    const props = { left: analyses[0], right: analyses[1], third };
    const render = () => h.render("FBe", props);
    render();
    await h.flush();
    let tree = render();
    nodes(tree).find(node => node.props?.value === "AB" && node.props.onValueChange)
      .props.onValueChange("BA");
    if (third) {
      nodes(tree).find(node => node.props?.value === "Scenario C" && node.props.onChange)
        .props.onChange({ target: { value: "Edited C" } });
      tree = render();
      const columns = nodes(tree).find(node => node.type === "label" && text(node) === "Edited C Sub.");
      nodes(columns).find(node => node.props?.onCheckedChange).props.onCheckedChange();
    }
    h.capturePdf();
    await nodes(render()).find(node => node.props?.onClick && text(node) === "Export PDF").props.onClick();
    const report = h.report();
    const shared = report.results.rows.find(row => row.includes("Shared"));
    assert.equal(shared.at(-2), "10,0");
    if (third) {
      assert.equal(report.paramTables[0].names[2], "Edited C");
      assert.ok(report.results.headers.includes("Edited C Vestas"));
      assert.ok(!report.results.headers.includes("Edited C Sub."));
      assert.equal(report.results.headers.length, shared.length);
    }
  }
});
