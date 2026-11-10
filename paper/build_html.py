"""Convert paper/main.tex (this paper's limited LaTeX subset) + references.bib to a print-ready HTML file.
Usage: python tex2html.py <paper_dir> <out.html>"""
import re
import sys
from pathlib import Path

src = Path(sys.argv[1]); out = Path(sys.argv[2])
tex = (src / "main.tex").read_text(encoding="utf-8")
bib = (src / "references.bib").read_text(encoding="utf-8")

# ---------------------------------------------------------------- bibliography
entries = {}
for m in re.finditer(r"@(\w+)\{([^,]+),(.*?)\n\}", bib, re.S):
    kind, key, body = m.group(1), m.group(2).strip(), m.group(3)
    f = {}
    for fm in re.finditer(r"(\w+)\s*=\s*\{(.*?)\},?\s*$", body, re.M | re.S):
        f[fm.group(1).lower()] = fm.group(2)
    entries[key] = (kind, f)


def clean(s):
    s = s.replace("\\&", "&amp;").replace("$>$", "&gt;").replace("\\%", "%").replace("--", "&ndash;")
    s = s.replace("{", "").replace("}", "")
    return s


def authors(a):
    names = [n.strip() for n in a.replace("\n", " ").split(" and ")]
    outn = []
    for n in names:
        n = clean(n)
        if n == "others":
            outn.append("et al."); continue
        if "," in n:
            last, first = [x.strip() for x in n.split(",", 1)]
            ini = " ".join(p[0] + "." for p in re.split(r"[\s]+", first) if p)
            ini = re.sub(r"(\w)\.-?", r"\1.", ini)
            hy = [p for p in first.split() if "-" in p]
            if hy:  # e.g. Zhong-Zhi -> Z.-Z.
                ini = " ".join(("-".join(q[0] + "." for q in p.split("-")) if "-" in p else p[0] + ".")
                               for p in first.split())
            outn.append(f"{ini} {last}")
        else:
            outn.append(n)
    if "et al." in outn:
        return outn[0] + " et al."
    if len(outn) > 8:
        return outn[0] + " et al."
    return ", ".join(outn[:-1]) + (" and " if len(outn) > 1 else "") + outn[-1]


def fmt_ref(key):
    kind, f = entries[key]
    who = authors(f["editor"]) + ", editors" if "editor" in f and "author" not in f else authors(f.get("author", ""))
    title = clean(f["title"])
    parts = [who + ("" if who.endswith(".") else ".") + " " + title + ("" if title[-1] in ".!?" else ".")]
    if "journal" in f:
        j = clean(f["journal"])
        v = f.get("volume"); n = f.get("number"); pg = f.get("pages")
        s = f"<i>{j}</i>" if not j.startswith("arXiv") else j.replace("arXiv preprint ", "")
        if v: s += f", {v}" + (f"({n})" if n else "")
        if pg: s += f":{clean(pg)}"
        parts.append(s + f", {f['year']}.")
    elif "booktitle" in f:
        s = f"In <i>{clean(f['booktitle'])}</i>"
        if f.get("editor") and "author" in f: s = f"In {authors(f['editor'])}, editor, <i>{clean(f['booktitle'])}</i>"
        if f.get("pages"): s += f", pages {clean(f['pages'])}"
        if f.get("publisher"): s += f". {clean(f['publisher'])}"
        parts.append(s + f", {f['year']}.")
    else:
        parts.append(f"{clean(f.get('publisher', ''))}, {f['year']}.")
    return " ".join(parts)


# ---------------------------------------------------------------- body
body = tex.split("\\begin{document}", 1)[1].split("\\bibliographystyle", 1)[0]
title = re.search(r"\\title\{(.*?)\}\n\\author", tex, re.S).group(1).replace("\\\\", "<br>")
order = []


def cite(m):
    keys = [k.strip() for k in m.group(1).split(",")]
    nums = []
    for k in keys:
        if k not in entries:
            raise SystemExit(f"missing bib key {k}")
        if k not in order: order.append(k)
        nums.append(order.index(k) + 1)
    nums.sort()
    # compress ranges
    out_, i = [], 0
    while i < len(nums):
        j = i
        while j + 1 < len(nums) and nums[j + 1] == nums[j] + 1: j += 1
        out_.append(f"{nums[i]}&ndash;{nums[j]}" if j - i >= 2 else ", ".join(str(x) for x in nums[i:j + 1]))
        i = j + 1
    return "[" + ", ".join(out_) + "]"


MATH = [
    (r"\\operatorname\{logit\}", "logit"), (r"\\log", "log"), (r"\\text\{([^}]*)\}", r"\1"), (r"\\hat p", "p&#770;"),
    (r"\\eta", "&eta;"), (r"\\theta", "&theta;"), (r"\\Delta", "&Delta;"), (r"\\sum", "&Sigma;"),
    (r"\\alpha", "&alpha;"), (r"\\kappa", "&kappa;"), (r"\\le\b", "&le;"), (r"\\in\b", "&isin;"),
    (r"\\times", "&times;"), (r"\\div", "&divide;"), (r"\\pm", "&plusmn;"), (r"\\approx", "&asymp;"),
    (r"\\rightarrow", "&rarr;"), (r"\\dots", "&hellip;"), (r"\\bigl|\\bigr", ""), (r"\\,", "&thinsp;"),
    (r"\\\{", "{"), (r"\\\}", "}"), (r"\\mid", "|"),
]


def math(s):
    for a, b in MATH: s = re.sub(a, b, s)
    s = re.sub(r"_\{([^}]*)\}", r"<sub>\1</sub>", s); s = re.sub(r"\^\{([^}]*)\}", r"<sup>\1</sup>", s)
    s = re.sub(r"_(\w)", r"<sub>\1</sub>", s); s = re.sub(r"\^(\w)", r"<sup>\1</sup>", s)
    s = s.replace("-", "&minus;").replace("+", "+")
    s = re.sub(r"(?<![&\w])([a-zA-Z])(?![\w;])", r"<i>\1</i>", s)
    return s


def inline(s):
    s = re.sub(r"\\cite[pt]?\{([^}]*)\}", cite, s)
    s = re.sub(r"\\todo\{([^}]*)\}", r'<span class="todo">[TODO: \1]</span>', s)
    s = re.sub(r"\$([^$]+)\$", lambda m: math(m.group(1)), s)
    s = re.sub(r"\\textbf\{([^}]*)\}", r"<b>\1</b>", s)
    s = re.sub(r"\\emph\{([^}]*)\}", r"<em>\1</em>", s)
    s = re.sub(r"\\texttt\{([^}]*)\}", r'<span class="tt">\1</span>', s)
    s = re.sub(r"\\textsc\{([^}]*)\}", r'<span class="sc">\1</span>', s)
    s = re.sub(r"\\shortstack\[l\]\{([^}]*)\}", lambda m: m.group(1).replace("\\\\", "<br>"), s)
    s = s.replace("\\_", "_").replace("\\%", "%").replace("\\&", "&amp;").replace("{,}", ",")
    s = s.replace("~", "&nbsp;").replace("---", "&mdash;").replace("--", "&ndash;").replace("\\ ", " ")
    s = s.replace("``", "&ldquo;").replace("''", "&rdquo;").replace("\\LaTeX\\", "LaTeX").replace("\\LaTeX", "LaTeX")
    s = s.replace("\\small", "").replace("\\centering", "").replace("\\,", "&thinsp;")
    return s


labels = {}
sec = [0, 0]
for m in re.finditer(r"\\(section|subsection)\{([^}]*)\}\s*(?:\\label\{([^}]*)\})?", body):
    if m.group(1) == "section": sec = [sec[0] + 1, 0]
    else: sec[1] += 1
    num = f"{sec[0]}" if m.group(1) == "section" else f"{sec[0]}.{sec[1]}"
    if m.group(3): labels[m.group(3)] = num
tabn = 0
for m in re.finditer(r"\\label\{(tab:[^}]*)\}", body):
    tabn += 1; labels[m.group(1)] = str(tabn)
labels["eq:lltm"] = "1"


def table(block):
    cap = re.search(r"\\caption\{(.*?)\}\n\\label", block, re.S)
    lab = re.search(r"\\label\{([^}]*)\}", block).group(1)
    tab = re.search(r"\\begin\{tabular\}\{[^}]*\}(.*?)\\end\{tabular\}", block, re.S).group(1)
    tab = re.sub(r"\\shortstack\[l\]\{([^}]*)\}", lambda m: m.group(1).replace("\\\\", "<br>"), tab, flags=re.S)
    rows, html, spans = [], [], {}
    in_head = True
    lines = [l.strip() for l in tab.split("\\\\")]
    out_rows = []
    for raw in lines:
        sep_above = "\\midrule" in raw and not raw.strip().startswith("\\toprule")
        r = re.sub(r"\\(toprule|bottomrule|midrule)", "", raw)
        r = re.sub(r"\\shortstack\[l\]\{([^}]*)\}", lambda m: m.group(1).replace("\\\\", "<br>"), r)
        r = re.sub(r"\\cmidrule\([^)]*\)\{[^}]*\}", "", r).strip()
        if not r:
            if sep_above and out_rows: out_rows.append(("SEP", None))
            continue
        cells = []
        for c in re.split(r"(?<!\\)&", r):
            c = c.strip(); span = 1; rs = 1
            mc = re.match(r"\\multicolumn\{(\d+)\}\{[^}]*\}\{(.*)\}$", c, re.S)
            if mc: span = int(mc.group(1)); c = mc.group(2)
            mr = re.match(r"\\multirow\{(\d+)\}\{[^}]*\}\{(.*)\}$", c, re.S)
            if mr: rs = int(mr.group(1)); c = mr.group(2)
            cells.append((inline(c), span, rs))
        out_rows.append(("SEPROW" if sep_above else "ROW", cells))
    # header = rows before first midrule in source
    head_n = tab.split("\\midrule")[0].count("\\\\")
    h = ['<div class="fig"><p class="cap"><b>Table ' + labels[lab] + '.</b> ' + inline(cap.group(1)) + '</p><table>']
    skip = 0; ri = 0; covered = 0
    body_rows = [r for r in out_rows]
    h.append("<thead>")
    pending_sep = False
    count = 0
    for kind, cells in body_rows:
        if kind == "SEP": pending_sep = True; continue
        tag = "th" if count < head_n else "td"
        if count == head_n: h.append("</thead><tbody>")
        cls = ' class="sep"' if (pending_sep or kind == "SEPROW") and count > head_n else ""
        pending_sep = False
        tds = []
        for ci, (c, span, rs) in enumerate(cells):
            if c == "" and rs == 1 and span == 1 and ci == 0 and covered > 0:
                continue
            attrs = (f' colspan="{span}"' if span > 1 else "") + (f' rowspan="{rs}"' if rs > 1 else "")
            left = ' class="l"' if ci < 2 and not span > 1 else ""
            tds.append(f"<{tag}{attrs}{left}>{c}</{tag}>")
            if rs > 1: covered = rs
        if covered > 0: covered -= 1
        h.append(f"<tr{cls}>" + "".join(tds) + "</tr>")
        count += 1
    h.append("</tbody></table></div>")
    return "\n".join(h)


# split into blocks
html = []
body = re.sub(r"(?m)^%.*\n", "", body)
body = body.replace("\\maketitle", "")
abstract = re.search(r"\\begin\{abstract\}(.*?)\\end\{abstract\}", body, re.S).group(1)
body = body.replace("\\begin{abstract}" + abstract + "\\end{abstract}", "")
tables = {}


def keep_table(m):
    k = f"@@TABLE{len(tables)}@@"; tables[k] = table(m.group(0)); return "\n\n" + k + "\n\n"


body = re.sub(r"\\begin\{table\}.*?\\end\{table\}", keep_table, body, flags=re.S)
body = re.sub(r"\\begin\{equation\}(.*?)\\label\{([^}]*)\}\s*\\end\{equation\}|\\begin\{equation\}(.*?)\\end\{equation\}",
              lambda m: "\n\n@@EQ" + (m.group(1) or m.group(3)).strip().replace("\n", " ") + "@@EQEND\n\n", body, flags=re.S)
eqn = [0]


def refs(s):
    s = re.sub(r"Eq\.~\\eqref\{([^}]*)\}", lambda m: "Eq.&nbsp;(" + labels[m.group(1)] + ")", s)
    s = re.sub(r"\\ref\{([^}]*)\}", lambda m: labels[m.group(1)], s)
    return s


def para_html(p):
    p = p.strip()
    if not p: return ""
    if p in tables: return tables[p]
    if p.startswith("@@EQ"):
        eqn[0] += 1
        return f'<div class="eq">{math(p[4:-6])}<span class="n">({eqn[0]})</span></div>'
    m = re.match(r"\\section\{([^}]*)\}\s*(\\label\{[^}]*\})?(.*)", p, re.S)
    if m:
        para_html.sec += 1; para_html.sub = 0
        rest = m.group(3)
        return f"<h2>{para_html.sec}&nbsp;&nbsp;{inline(m.group(1))}</h2>" + (para_html(rest) if rest.strip() else "")
    m = re.match(r"\\subsection\{([^}]*)\}\s*(\\label\{[^}]*\})?(.*)", p, re.S)
    if m:
        para_html.sub += 1
        rest = m.group(3)
        return (f'<h3 class="sub">{para_html.sec}.{para_html.sub}&nbsp;&nbsp;{inline(m.group(1))}</h3>'
                + (para_html(rest) if rest.strip() else ""))
    m = re.match(r"\\begin\{(itemize|enumerate)\}(.*)\\end\{\1\}(.*)", p, re.S)
    if m:
        tag = "ul" if m.group(1) == "itemize" else "ol"
        items = [i.strip() for i in m.group(2).split("\\item") if i.strip()]
        out_ = f"<{tag}>" + "".join(f"<li>{inline(i)}</li>" for i in items) + f"</{tag}>"
        return out_ + (para_html(m.group(3)) if m.group(3).strip() else "")
    k = re.search(r"\\begin\{(itemize|enumerate)\}", p)
    if k and k.start() > 0:
        return para_html(p[:k.start()]) + para_html(p[k.start():])
    lead = ""
    m = re.match(r"\\paragraph\{([^}]*)\}(.*)", p, re.S)
    if m:
        lead = f'<span class="para">{inline(m.group(1))}</span> '; p = m.group(2)
        if p.strip().startswith("\\begin{itemize}"):
            return f"<p>{lead}</p>" + para_html(p.strip())
    return f"<p>{lead}{inline(p)}</p>"


para_html.sec = 0; para_html.sub = 0
# make sure environments stay in one block
body = re.sub(r"\\begin\{(itemize|enumerate)\}.*?\\end\{\1\}", lambda m: m.group(0).replace("\n\n", "\n"), body, flags=re.S)
body = refs(body)
abs_html = inline(refs(abstract.strip()))
blocks = re.split(r"\n\s*\n", body)
main_html = "\n".join(para_html(b) for b in blocks)
ref_html = "\n".join(f"<p>[{i + 1}] {fmt_ref(k)}</p>" for i, k in enumerate(order))
author = inline(re.search(r"\\author\{(.*?)\}\n\\date", tex, re.S).group(1))
date = re.search(r"\\date\{(.*?)\}", tex).group(1)

css = Path(sys.argv[3]).read_text(encoding="utf-8") if len(sys.argv) > 3 else ""
page = f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Targeting or Difficulty? (draft)</title>
<style>{css}</style></head><body>
<h1>{inline(title)}</h1><div class="meta">{author}<br>{date}</div>
<div class="abstract"><h3>Abstract</h3><p>{abs_html}</p></div>
{main_html}
<h2>References</h2><div class="refs">{ref_html}</div></body></html>"""
out.write_text(page, encoding="utf-8")
print("refs", len(order), "tables", len(tables), "unconverted:", sorted(set(re.findall(r"\\[a-zA-Z]+", main_html + abs_html))))
