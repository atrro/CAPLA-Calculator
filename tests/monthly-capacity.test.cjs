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

const context = {
  Jh: value => value,
  LB: value => Number(value),
  Ac: value => Math.round(value * 10) / 10,
  _u() {},
  yn: { utils: {
    json_to_sheet: rows => ({ rows }),
    aoa_to_sheet: rows => ({ rows }),
  } },
};
vm.createContext(context);
vm.runInContext([
  extract("function ai(", "function Hn("),
  extract("function Hn(", "function Mv("),
  extract("function Mv(", "function Np("),
  extract("function Np(", "function Ove("),
  extract("function Ove(", "function K2("),
  extract("function BSe(", "const Ma="),
  extract("function LGe(", "function Mie("),
  extract("function ySe(", "function _u("),
  extract("function mSe(", "function nm("),
  extract("function $te(", "function p6("),
].join("\n"), context);

const params = {
  weeklyWorkingHours: 40, lunchTimePerDay: 1,
  vacationDays: 30, yearlyBankHoliday: 10,
  overtime: 20, absence: 10, overtimeSubcontractor: 10,
  mobDemob: 0, travel: 0, lunch: 0,
  dtrWindfarm: 100, dtrSpecialTask: 100,
  ym02ToExecute: 50, ym02SpecialTask: 0,
  ym05SpecialTask: 0, ym07SpecialTask: 0,
  estimatedSubcontractors: 30,
};

test("monthly Vestas uses overtime and absence; Sub uses overtime only", () => {
  const annual = context.Np(params);
  assert.ok(Math.abs(annual.workingHoursMonthComAlmocoVestas - 182.325) < 1e-9);
  assert.ok(Math.abs(annual.workingHoursMonthComAlmocoSub - 182.325) < 1e-9);
  assert.equal(annual.workingHoursMonthComAlmocoVestas, annual.annualWorkingHoursVestasAdjusted / 12);
  assert.equal(annual.workingHoursMonthComAlmocoSub, annual.annualWorkingHoursSubcontractor / 12);
  const higherAbsence = context.Np({ ...params, absence: 25 });
  assert.ok(higherAbsence.workingHoursMonthComAlmocoVestas < annual.workingHoursMonthComAlmocoVestas);
  assert.equal(higherAbsence.workingHoursMonthComAlmocoSub, annual.workingHoursMonthComAlmocoSub);
  const zero = context.Np({ ...params, overtime: 0, absence: 0, overtimeSubcontractor: 0 });
  assert.equal(zero.workingHoursMonthComAlmocoVestas, 165.75);
  assert.equal(zero.workingHoursMonthComAlmocoSub, 165.75);
  assert.equal(annual.workingHoursMonthSemAlmocoVestas, 8 * 221 / 12);
});

test("existing saved rows export adjusted monthly hours without being modified", () => {
  const saved = { data: [{
    state: "RN", site: "Example", turbineType: "T", turbineAmount: 1,
    month: "01", orderType: "YM01", hoursActivity: 100,
    hoursMobDemobTravelAlmocoDtrSite: 100,
    workingHoursMonthComAlmocoVestas: 165.8,
    workingHoursMonthComAlmocoSub: 182.3,
    caplaVestas: 7.5, caplaSubcontractor: 2.5,
  }] };
  const original = JSON.stringify(saved);
  const monthly = context.BSe(saved, params).rows[0];
  assert.equal(monthly["Working hours Month - Tec - Com Almoço Vestas"], 182.3);
  assert.equal(monthly["Working hours Month - Tec - Com Almoço - Sub"], 182.3);
  const overview = context.LGe(saved, params);
  assert.equal(overview.rows[1][4], 182.3);
  assert.equal(overview.rows[1][5], 182.3);
  assert.equal(overview.H2.f, "IF(F2=0,0,ROUND((D2-E2*G2)/F2,1))");
  const data = context.$te(saved, ["Site"], params).rows[0];
  assert.equal(data["Working hours Month - Tec - Com Almoço Vestas"], 182.3);
  assert.equal(data["Working hours Month - Tec - Com Almoço - Sub"], 182.3);
  assert.equal(JSON.stringify(saved), original);
});

test("annual outputs and demand are unchanged by the monthly adjustment", () => {
  const annual = context.Np(params);
  assert.ok(Math.abs(annual.annualWorkingHoursVestasAdjusted - 2187.9) < 1e-9);
  assert.ok(Math.abs(annual.annualWorkingHoursSubcontractor - 2187.9) < 1e-9);
  assert.equal(annual.workingHoursYearComAlmocoVestas, 1989);
  assert.equal(annual.workingHoursYearComAlmocoSub, 2349);
  const row = context.Ove({ hoursActivity: 100, orderType: "YM01" }, params, 0, []);
  assert.equal(row.totalDemandHoursSite, 100);
  assert.equal(row.workingHoursMonthComAlmocoVestas, 182.3);
  assert.equal(row.workingHoursMonthComAlmocoSub, 182.3);
});
