# What changes when the paper goes to a different journal

The draft in `main.tex` is written for a general journal. Before sending it to a specific one, check each
item below against that journal's "Guide for authors" and change only what the journal asks for.
The science (numbers, tables, claims) never changes between journals.

| # | Item | Where in `main.tex` | Now (general) | What journals vary on |
|---|---|---|---|---|
| 1 | Template / class | `\documentclass{article}` + packages | plain article, 11 pt, 1 in margins | Elsevier `elsarticle`, Springer `sn-jnl`, IEEE `IEEEtran`, ACM `acmart`, MDPI/PLOS Word or LaTeX templates; single vs. two columns |
| 2 | Reference style | `\bibliographystyle{plainnat}`, `natbib` | author–year names, numbered | numbered [1] (IEEE, Springer basic), author–year (Elsevier Harvard, APA); some need DOIs on every entry |
| 3 | Abstract | `abstract` env | ~220 words, one paragraph | word limit (150–300); structured abstract (Background / Methods / Results / Conclusions) at some journals |
| 4 | Keywords | not present yet | — | most journals want 4–6 keywords after the abstract |
| 5 | Highlights / graphical abstract | not present | — | Elsevier asks for 3–5 highlights (≤85 characters each); some ask for a graphical abstract |
| 6 | Length | ~5,000 words, 5 tables | — | page or word limits (letters ~4 pages, full papers 8–30 pages); move details to an appendix or supplement if needed |
| 7 | Authors and affiliations | `\author{...}` | 4 names; affiliation and e-mail still TODO | format of affiliations, ORCID iDs, corresponding-author marker |
| 8 | Author contributions | `\paragraph{Author contributions.}` | one general sentence | CRediT roles per author (Conceptualization, Software, …) at Elsevier/Springer/PLOS; some journals have none |
| 9 | Funding | `\paragraph{Funding.}` | "no specific grant" | exact wording; grant numbers if any |
| 10 | Competing interests | `\paragraph{Competing interests.}` | "none" | heading name ("Declaration of competing interest", "Conflict of interest") |
| 11 | AI-use statement | `\paragraph{Use of AI tools.}` | names the assistant and what it did | Elsevier wants a "Declaration of generative AI…" section before the references; Springer puts it in Methods; some ban AI-written text — read the policy first |
| 12 | Data and code availability | `\paragraph{Data and code availability.}` | GitHub link + run IDs | some want a DOI (Zenodo copy of the repo), a "Data availability statement" heading, or code in a supplement |
| 13 | Anonymity | author block, repo URL, AI-use statement | names visible | double-blind journals/conferences: remove names, anonymise the repo link (e.g. anonymous.4open.science) |
| 14 | Figures and tables | tables in text | inline tables, no figures | some want tables/figures at the end or as separate files; figure format/DPI rules |
| 15 | Cover letter, suggested reviewers | not written | — | most journals ask for both at submission |

Also check per journal: whether a preprint (arXiv) is allowed, the licence (open access fee or not), and
whether the language is US or UK English.
