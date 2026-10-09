"""Independent reference calculator for the test plan.

Uses exact rational arithmetic (fractions.Fraction) and shares no code with
the app. Expected values in docs/TEST_PLAN.md and the Vitest suites are
copied from this script's output, never from the app's own calculation.

Run: python3 -I tools/reference_values.py
"""
from decimal import Decimal, ROUND_HALF_UP
from fractions import Fraction as F

RULES = {
    "TY2026": {
        # (threshold, base tax, marginal rate %) -- Division I, Part I, First Schedule, clause (2)
        "slabs": [(0, 0, 0), (600_000, 0, 1), (1_200_000, 6_000, 11), (2_200_000, 116_000, 23),
                  (3_200_000, 346_000, 30), (4_100_000, 616_000, 35)],
        "surcharge_rate": F(9, 100),  # s.4AB proviso, salaried, taxable income > Rs 10m
        "max_annual": F(150_000_000),  # s.4C super tax starts above this
    },
    "TY2027": {
        "slabs": [(0, 0, 0), (600_000, 0, 1), (1_200_000, 6_000, 11), (2_200_000, 116_000, 20),
                  (3_200_000, 316_000, 25), (4_100_000, 541_000, 29), (5_600_000, 976_000, 32),
                  (7_000_000, 1_424_000, 35)],
        "surcharge_rate": F(0),  # withdrawn for salaried individuals by Finance Act 2026
        "max_annual": F(500_000_000),
    },
}
SURCHARGE_THRESHOLD = F(10_000_000)


def d2(x):
    """Round half up to 2 dp for display."""
    return (Decimal(x.numerator) / Decimal(x.denominator)).quantize(Decimal("0.01"), ROUND_HALF_UP)


def money(x):
    s = f"{d2(x):,.2f}"
    exact = Decimal(x.numerator) / Decimal(x.denominator)
    return s if exact == d2(x) else "≈" + s


def s219(x):
    """Section 219: < 50 paisa disregarded, >= 50 paisa treated as one rupee."""
    return F((x + F(1, 2)).__floor__())


def calc(year, annual):
    r = RULES[year]
    if annual > r["max_annual"]:
        return None
    idx = max(i for i, (t, _, _) in enumerate(r["slabs"]) if i == 0 or annual > t)
    t, base, rate = r["slabs"][idx]
    excess = annual - t
    marginal = excess * F(rate, 100)
    div1 = base + marginal
    sur = div1 * r["surcharge_rate"] if annual > SURCHARGE_THRESHOLD else F(0)
    before = div1 + sur
    payable = s219(before)
    net = annual - payable
    return dict(slab=idx + 1, threshold=t, base=base, rate=rate, excess=excess, marginal=marginal,
                div1=div1, sur=sur, before=before, payable=payable, monthly_tax=payable / 12,
                net=net, net_monthly=net / 12)


CASES = [
    # (year, period, input amount as exact string)
    ("TY2026", "annual", "0"), ("TY2026", "annual", "600000"), ("TY2026", "annual", "600000.01"),
    ("TY2026", "annual", "600049.99"), ("TY2026", "annual", "600050"), ("TY2026", "annual", "1000000"),
    ("TY2026", "annual", "1200000"), ("TY2026", "annual", "1200000.01"), ("TY2026", "annual", "2200000"),
    ("TY2026", "annual", "2200000.01"), ("TY2026", "annual", "3000000"), ("TY2026", "annual", "3200000"),
    ("TY2026", "annual", "3200000.01"), ("TY2026", "annual", "4100000"), ("TY2026", "annual", "4100000.01"),
    ("TY2026", "annual", "10000000"), ("TY2026", "annual", "10000000.01"), ("TY2026", "annual", "12000000"),
    ("TY2026", "annual", "149999999.99"), ("TY2026", "annual", "150000000"), ("TY2026", "annual", "150000000.01"),
    ("TY2026", "monthly", "100000"), ("TY2026", "monthly", "250000"), ("TY2026", "monthly", "12499999.99"),
    ("TY2026", "monthly", "12500000"), ("TY2026", "monthly", "12500000.01"),
    ("TY2027", "annual", "0"), ("TY2027", "annual", "600000"), ("TY2027", "annual", "600049.99"),
    ("TY2027", "annual", "600050"), ("TY2027", "annual", "1200000"), ("TY2027", "annual", "1200000.01"),
    ("TY2027", "annual", "2200000"), ("TY2027", "annual", "2200000.01"), ("TY2027", "annual", "3000000"),
    ("TY2027", "annual", "3200000"), ("TY2027", "annual", "3200000.01"), ("TY2027", "annual", "4100000"),
    ("TY2027", "annual", "4100000.01"), ("TY2027", "annual", "5600000"), ("TY2027", "annual", "5600000.01"),
    ("TY2027", "annual", "7000000"), ("TY2027", "annual", "7000000.01"), ("TY2027", "annual", "10000000"),
    ("TY2027", "annual", "10000000.01"), ("TY2027", "annual", "12000000"),
    ("TY2027", "annual", "499999999.99"), ("TY2027", "annual", "500000000"), ("TY2027", "annual", "500000000.01"),
    ("TY2027", "monthly", "100000"), ("TY2027", "monthly", "250000"), ("TY2027", "monthly", "41666666.65"),
    ("TY2027", "monthly", "41666666.66"), ("TY2027", "monthly", "41666666.67"),
]

def parse(amt):
    return F(amt) if "." not in amt else F(amt.replace(".", "")) / 10 ** len(amt.split(".")[1])


def story_cases(year):
    """Grouped cases with stable IDs for docs/user-stories.md (Appendix A)."""
    yy = year[-2:]
    thresholds = [t for t, _, _ in RULES[year]["slabs"][1:]]
    mx = int(RULES[year]["max_annual"])
    monthly_max = (["12499999.99", "12500000", "12500000.01"] if year == "TY2026"
                   else ["41666666.65", "41666666.66", "41666666.67"])
    groups = [
        ("Zero and small values", [
            ("annual", "0"), ("monthly", "0"), ("annual", "0.01"), ("annual", "1"), ("monthly", "0.01"),
            ("annual", "600001"), ("annual", "600049.99"), ("annual", "600050"), ("annual", "600100"),
            ("monthly", "50000.01"), ("annual", "650000")]),
        ("Every band boundary (at the limit, and 0.01 above)",
            [("annual", "600000"), ("annual", "600000.01")] +
            [c for t in thresholds[1:] for c in (("annual", str(t)), ("annual", f"{t}.01"))] +
            [("monthly", "50000"), ("monthly", "100000")]),
        ("Surcharge boundary (Rs 10,000,000)", [
            ("annual", "9999999.99"), ("annual", "10000000"), ("annual", "10000000.01"),
            ("monthly", "833333.33"), ("monthly", "833333.34")]),
        ("Supported maximum (below, at, above)",
            [("annual", f"{mx - 1}.99"), ("annual", str(mx)), ("annual", f"{mx}.01")] +
            [("monthly", m) for m in monthly_max]),
        ("Typical salaries (monthly and annual equivalents)", [
            ("monthly", "250000"), ("annual", "3000000"), ("monthly", "1000000"), ("annual", "12000000")]),
        # Appended later; groups are only ever appended so existing EX IDs stay stable.
        ("Values cited by stories", [
            ("annual", "1000000"), ("annual", "250000"), ("monthly", "1200000"), ("annual", "5000000.50")]),
        ("Every band: mid-band example and 0.01 below each boundary",
            [("annual", "300000")] +
            [c for (t, _, _), nxt in zip(RULES[year]["slabs"][1:], RULES[year]["slabs"][2:] + [None])
             for c in (("annual", f"{t - 1}.99"),
                       ("annual", str((t + nxt[0]) // 2) if nxt else str(t + 500_000)))]),
    ]
    n = 0
    for name, cases in groups:
        rows = []
        for period, amt in cases:
            n += 1
            rows.append((f"EX-{yy}-{n:02d}", period, amt))
        yield name, rows


def print_story_tables():
    for year in RULES:
        label = "FY 2025-26 (Tax Year 2026)" if year == "TY2026" else "FY 2026-27 (Tax Year 2027)"
        print(f"\n### {label}\n")
        for name, rows in story_cases(year):
            print(f"\n#### {name}\n")
            print("| ID | Input | Annual taxable income | Slab (threshold) | Base tax | Excess | Rate | Marginal tax "
                  "| Surcharge | Calculated tax before rounding | Annual tax payable | Avg monthly tax "
                  "| Annual income after tax | Avg monthly income after tax |")
            print("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|")
            for cid, period, amt in rows:
                inp = parse(amt)
                annual = inp * 12 if period == "monthly" else inp
                r = calc(year, annual)
                head = f"| {cid} | {money(inp)} {period} | {money(annual)}"
                if r is None:
                    print(head + " | **Error ABOVE_MAX — no result** | – | – | – | – | – | – | – | – | – | – |")
                    continue
                print(head + f" | {r['slab']} ({r['threshold']:,}) | {money(F(r['base']))} | {money(r['excess'])} "
                      f"| {r['rate']}% | {money(r['marginal'])} | {money(r['sur'])} | {money(r['before'])} "
                      f"| {money(r['payable'])} | {money(r['monthly_tax'])} | {money(r['net'])} "
                      f"| {money(r['net_monthly'])} |")


def exact(x):
    """Exact rupee amount as a reduced 'numerator/denominator' string, for BigInt comparison."""
    return f"{x.numerator}/{x.denominator}"


def money_json(x):
    d = Decimal(x.numerator) / Decimal(x.denominator)
    return {"exact": exact(x), "display": f"{d2(x):,.2f}", "approx": d != d2(x)}


def json_cases():
    """Appendix A as data. Same cases and IDs as --stories; values from calc() above."""
    cases = []
    for year in RULES:
        for group, rows in story_cases(year):
            for cid, period, amt in rows:
                inp = parse(amt)
                annual = inp * 12 if period == "monthly" else inp
                case = {"id": cid, "group": group, "taxYear": int(year[2:]), "period": period, "input": amt,
                        "annual": money_json(annual)}
                r = calc(year, annual)
                if r is None:
                    case.update(error="ABOVE_MAX", max=money_json(RULES[year]["max_annual"]), result=None)
                else:
                    case.update(error=None, result={
                        "slab": r["slab"], "threshold": r["threshold"], "ratePercent": r["rate"],
                        "baseTax": money_json(F(r["base"])), "excess": money_json(r["excess"]),
                        "marginalTax": money_json(r["marginal"]), "divisionITax": money_json(r["div1"]),
                        "surcharge": money_json(r["sur"]), "surchargeApplies": r["sur"] > 0,
                        "taxBeforeRounding": money_json(r["before"]), "taxPayable": money_json(r["payable"]),
                        "s219": "rounded up" if r["payable"] > r["before"] else
                                ("dropped" if r["payable"] < r["before"] else "exact"),
                        "avgMonthlyTax": money_json(r["monthly_tax"]),
                        "incomeAfterTax": money_json(r["net"]), "avgMonthlyIncomeAfterTax": money_json(r["net_monthly"]),
                    })
                cases.append(case)
    return cases


def print_json():
    import json
    doc = {
        "generator": "python3 -I tools/reference_values.py --json",
        "law": "docs/tax-rules.md (verified 2026-10-09)",
        "independence": "Computed with Python fractions from the verified rule tables in this script; "
                        "never from the application's code.",
        "moneyFormat": "exact = reduced rupees 'n/d'; display = 2 dp half up, international grouping, no 'Rs'; "
                       "approx = display differs from exact (UI prefixes ≈)",
        "cases": json_cases(),
    }
    print(json.dumps(doc, ensure_ascii=False, indent=1, sort_keys=False))


_argv = __import__("sys").argv
if __name__ == "__main__" and len(_argv) > 1 and _argv[1] == "--stories":
    print_story_tables()
elif __name__ == "__main__" and len(_argv) > 1 and _argv[1] == "--json":
    print_json()
elif __name__ == "__main__":
    print("| # | Year | Input | Annual income | Slab | Division I tax | Surcharge | Calculated tax before rounding "
          "| Annual tax payable (s.219) | Avg monthly tax | Annual income after tax | Avg monthly income after tax |")
    print("|---|---|---|---|---|---|---|---|---|---|---|---|")
    for n, (year, period, amt) in enumerate(CASES, 1):
        inp = F(amt) if "." not in amt else F(amt.replace(".", "")) / 10 ** len(amt.split(".")[1])
        annual = inp * 12 if period == "monthly" else inp
        label = f"{money(inp)} {period}"
        r = calc(year, annual)
        if r is None:
            print(f"| {n} | {year} | {label} | {money(annual)} | **Rejected: above supported maximum** "
                  "| – | – | – | – | – | – | – |")
            continue
        print(f"| {n} | {year} | {label} | {money(annual)} | {r['slab']} | {money(r['div1'])} | {money(r['sur'])} "
              f"| {money(r['before'])} | {money(r['payable'])} | {money(r['monthly_tax'])} | {money(r['net'])} "
              f"| {money(r['net_monthly'])} |")
