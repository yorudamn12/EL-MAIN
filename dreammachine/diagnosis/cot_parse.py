"""Parse `expr = value` equations out of a chain of thought and re-check them.

The re-check is what makes ARITHMETIC_SLIP detectable without annotators:
if the model writes `48 * 7 = 326`, that equation evaluates to 336, so it
is a slip, whatever the rest of the reasoning looks like.
"""

from __future__ import annotations

import ast
import re
from dataclasses import dataclass, field
from fractions import Fraction

from .extract import strip_reasoning_tags

_ANNOT = re.compile(r"<<[^<>]*>>")
_EQ = re.compile(r"([0-9.\s+\-*/()]*[0-9][0-9.\s+\-*/()]*)=\s*(-?\d+(?:\.\d+)?)")
_HAS_OP = re.compile(r"\d\s*\)?\s*[-+*/]\s*\(?\s*-?\d")
_NUM = re.compile(r"\d+(?:\.\d+)?")
# The rest of a right-hand side on the same line, so that a chained 'a - b - c = a - d = e' is checked as
# (a - b - c) == (a - d), not against the bare first number 'a'.
_RHS_TAIL = re.compile(r"[0-9. 	+\-*/()]*")


@dataclass
class Equation:
    lhs: str
    lhs_value: Fraction
    rhs_value: Fraction
    operands: list[Fraction] = field(default_factory=list)
    ops: list[str] = field(default_factory=list)
    correct: bool = True
    position: int = 0  # character offset in the normalised text


def normalise(text: str) -> str:
    t = strip_reasoning_tags(text)
    t = _ANNOT.sub("", t)                               # GSM8K calculator annotations
    t = re.sub(r"\*\*|__", " ", t)                      # Markdown bold: **6 - 2 = 4** -> 6 - 2 = 4
    t = t.replace("×", "*").replace("·", "*").replace("÷", "/").replace("−", "-").replace("–", "-")
    t = re.sub(r"\\times", "*", t)
    t = re.sub(r"\\div", "/", t)
    t = re.sub(r"(?<=\d)\s*[xX]\s*(?=\d)", " * ", t)    # 3 x 4
    t = re.sub(r"\$\s*(?=\d)", "", t)                    # $12 -> 12
    t = re.sub(r"(?<=\d),(?=\d{3}\b)", "", t)            # 1,234 -> 1234
    t = re.sub(r"(?<=\d)%", "", t)
    return t


class _Eval(ast.NodeVisitor):
    """Exact evaluator over a whitelist of arithmetic AST nodes only."""

    def visit(self, node):  # type: ignore[override]
        if isinstance(node, ast.Expression):
            return self.visit(node.body)
        if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
            return Fraction(str(node.value))
        if isinstance(node, ast.UnaryOp) and isinstance(node.op, (ast.USub, ast.UAdd)):
            v = self.visit(node.operand)
            return -v if isinstance(node.op, ast.USub) else v
        if isinstance(node, ast.BinOp):
            a, b = self.visit(node.left), self.visit(node.right)
            if isinstance(node.op, ast.Add):
                return a + b
            if isinstance(node.op, ast.Sub):
                return a - b
            if isinstance(node.op, ast.Mult):
                return a * b
            if isinstance(node.op, ast.Div):
                if b == 0:
                    raise ZeroDivisionError
                return a / b
        raise ValueError(f"disallowed expression node: {type(node).__name__}")


def safe_eval(expr: str) -> Fraction:
    return _Eval().visit(ast.parse(expr.strip(), mode="eval"))


def _balance(expr: str) -> str:
    """Trim unmatched leading '(' or trailing ')' left over from the regex window."""
    e = expr.strip()
    while e.startswith("(") and e.count("(") > e.count(")"):
        e = e[1:].strip()
    while e.endswith(")") and e.count(")") > e.count("("):
        e = e[:-1].strip()
    return e


def _close_enough(lhs: Fraction, rhs: Fraction, rhs_text: str) -> bool:
    if lhs == rhs:
        return True
    if "." in rhs_text:  # the model rounded; accept it if it rounded correctly
        decimals = len(rhs_text.split(".")[1])
        return abs(lhs - rhs) <= Fraction(1, 2 * 10**decimals) + Fraction(1, 10**12)
    return False


def _parse_lhs(raw: str) -> tuple[str, Fraction] | None:
    """Evaluate the longest whitespace-suffix of `raw` that is a valid expression.

    Handles text glued to the front, e.g. a list number: '2. 5 + 3' -> '5 + 3'.
    """
    tokens = _balance(raw).split()
    for i in range(len(tokens)):
        cand = _balance(" ".join(tokens[i:]))
        if not _HAS_OP.search(cand):
            return None
        try:
            return cand, safe_eval(cand)
        except (SyntaxError, ValueError, ZeroDivisionError, RecursionError):
            continue
    return None


def parse_equations(text: str) -> list[Equation]:
    t = normalise(text)
    out: list[Equation] = []
    pos = 0
    while (m := _EQ.search(t, pos)) is not None:
        # Resume at the right-hand side, so chained 'a*b = c + d = e' yields both equations.
        pos = m.start(2)
        parsed = _parse_lhs(m.group(1))
        if parsed is None:
            continue
        lhs, lhs_val = parsed
        rhs_text = m.group(2)
        rhs_val = Fraction(rhs_text)
        tail = _RHS_TAIL.match(t, m.start(2)).group(0)
        rhs_expr = _balance(tail.rstrip(" 	.").rstrip(" 	"))
        correct = _close_enough(lhs_val, rhs_val, rhs_text)
        # Two chaining styles: a running total '25 * 9 = 225 + 5 = 230' (lhs equals the first number) and an
        # expression chain '17265 - 6469 - 3447 = 17265 - 9916 = 7349' (lhs equals the whole next expression).
        if not correct and rhs_expr != rhs_text and _HAS_OP.search(rhs_expr):
            try:
                expr_val = safe_eval(rhs_expr)
            except (SyntaxError, ValueError, ZeroDivisionError, RecursionError):
                expr_val = None
            if expr_val is not None and lhs_val == expr_val:
                rhs_val, correct = expr_val, True
        out.append(Equation(
            lhs=lhs,
            lhs_value=lhs_val,
            rhs_value=rhs_val,
            operands=[Fraction(x) for x in _NUM.findall(lhs)],
            ops=re.findall(r"(?<=[\d)\s])[-+*/](?=[\s(\d])", lhs),
            correct=correct,
            position=m.start(),
        ))
    return out
