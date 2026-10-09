"""Worked calculations and boundary checks for docs/tax-rules.md.

Exact rational arithmetic (fractions.Fraction). Independent of the app code.
Prints Markdown. Run: python3 -I tools/rule_checks.py
"""
from decimal import Decimal, ROUND_HALF_UP
from fractions import Fraction as F

YEARS = {
    "TY 2026": [(0, None, 0, 0), (600_000, 1_200_000, 0, 1), (1_200_000, 2_200_000, 6_000, 11),
                (2_200_000, 3_200_000, 116_000, 23), (3_200_000, 4_100_000, 346_000, 30),
                (4_100_000, None, 616_000, 35)],
    "TY 2027": [(0, None, 0, 0), (600_000, 1_200_000, 0, 1), (1_200_000, 2_200_000, 6_000, 11),
                (2_200_000, 3_200_000, 116_000, 20), (3_200_000, 4_100_000, 316_000, 25),
                (4_100_000, 5_600_000, 541_000, 29), (5_600_000, 7_000_000, 976_000, 32),
                (7_000_000, None, 1_424_000, 35)],
}
# Slab 1 upper limit is 600,000 in both years.
for y in YEARS:
    t, _, b, r = YEARS[y][0]
    YEARS[y][0] = (0, 600_000, b, r)

SURCHARGE = {"TY 2026": F(9, 100), "TY 2027": F(0)}
CAP = {"TY 2026": (F(150_000_000), F(1, 100), "1%"), "TY 2027": (F(500_000_000), F(8, 100), "8%")}


def m(x):
    """Exact value if it terminates within 6 dp, else 2-dp half-up with ≈."""
    d = Decimal(x.numerator) / Decimal(x.denominator)
    q2 = d.quantize(Decimal("0.01"), ROUND_HALF_UP)
    if d == q2:
        return f"{q2:,.2f}"
    q6 = d.quantize(Decimal("0.000001"), ROUND_HALF_UP)
    s = f"{q6:,.6f}".rstrip("0")
    return s if q6 == d else "≈" + f"{q2:,.2f}"


def slab_tax(slab, income):
    t, _, base, rate = slab
    return base + (income - t) * F(rate, 100)


def s219(x):
    return F((x + F(1, 2)).__floor__())


for year, slabs in YEARS.items():
    print(f"\n### {year} — worked calculation for every band\n")
    print("| Slab | Income tested | Formula with substituted numbers | Division I tax |")
    print("|---|---|---|---|")
    for i, s in enumerate(slabs, 1):
        t, u, base, rate = s
        points = []
        lo = F(0) if i == 1 else F(t) + F(1, 100)
        hi = F(u) if u is not None else F(t) + F(1_000_000)
        mid = (F(t) + hi) / 2 if i > 1 else F(300_000)
        for p in ([F(0), mid, F(u)] if i == 1 else [lo, mid, hi]):
            points.append(p)
        for p in points:
            f = f"{base:,} + {rate}% × ({m(p)} − {t:,}) = {base:,} + {rate}% × {m(p - t)}"
            print(f"| {i} | {m(p)} | {f} | {m(slab_tax(s, p))} |")

    print(f"\n### {year} — continuity at every shared boundary\n")
    print("| Boundary | Lower slab formula at boundary | Upper slab formula at boundary | Equal? |")
    print("|---|---|---|---|")
    for i in range(len(slabs) - 1):
        lo, up = slabs[i], slabs[i + 1]
        b = F(lo[1])
        a = slab_tax(lo, b)
        c = slab_tax(up, b)
        print(f"| {lo[1]:,} | slab {i+1}: {lo[2]:,} + {lo[3]}% × {m(b - lo[0])} = {m(a)} "
              f"| slab {i+2}: {up[2]:,} + {up[3]}% × 0.00 = {m(c)} | {'yes' if a == c else '**NO**'} |")

    print(f"\n### {year} — surcharge boundary (s.4AB)\n")
    print("| Taxable income | Division I tax | Surcharge | Calculated tax | Tax payable (s.219) | Income after tax |")
    print("|---|---|---|---|---|---|")
    top = slabs[-1]
    rows = []
    for p in [F(10_000_000) - F(1, 100), F(10_000_000), F(10_000_000) + F(1, 100)]:
        d1 = slab_tax(top, p)
        sur = d1 * SURCHARGE[year] if p > 10_000_000 else F(0)
        pay = s219(d1 + sur)
        rows.append((p, pay))
        print(f"| {m(p)} | {m(d1)} | {m(sur)} | {m(d1 + sur)} | {m(pay)} | {m(p - pay)} |")
    jump = rows[2][1] - rows[1][1]
    print(f"\nTax payable changes by **{m(jump)}** when income rises by 0.01 across Rs 10,000,000.")

    cap, rate, label = CAP[year]
    print(f"\n### {year} — supported-range boundary (s.4C)\n")
    print("| Taxable income | Division I tax + surcharge | s.4C super tax (not calculated by app) |")
    print("|---|---|---|")
    for p in [cap, cap + F(1, 100)]:
        d1 = slab_tax(top, p)
        sur = d1 * SURCHARGE[year] if p > 10_000_000 else F(0)
        st = p * rate if p > cap else F(0)
        print(f"| {m(p)} | {m(d1 + sur)} | {m(st)}{' (' + label + ' of entire income)' if st else ''} |")
