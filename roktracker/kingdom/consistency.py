"""Cross-field consistency checks for OCR'd governor statistics.

The killpoint fields carry two independent, *exact* integer identities in the
game UI:

    killpoints == sum(tier_kp)
    killpoints == sum(floor(tier_kills * weight))

Together they cover 11 OCR'd fields, which makes them a strong free accuracy
check -- but only if a failed read is distinguishable from a genuine zero.
The old code routed every value through ``to_int_check``, which returns 0 on
failure, so an unreadable tier contributed ``floor(0*0.2) == 0`` and could
quietly satisfy the identity. Everything here parses with ``to_int_strict``
instead and refuses to reason about values it never actually read.

Each check returns a status rather than a bare bool, so callers can tell
"checked and fine" apart from "never scanned" apart from "could not check".
"""

import math
from typing import Any

from roktracker.utils.general import to_int_strict

SKIPPED = "Skipped"
UNKNOWN = "Unknown"

# Killpoints contributed by a single kill in each tier.
TIER_KP_WEIGHTS: tuple[tuple[str, float], ...] = (
    ("t1", 0.2),
    ("t2", 2),
    ("t3", 4),
    ("t4", 10),
    ("t5", 20),
)
TIER_NAMES: tuple[str, ...] = tuple(name for name, _ in TIER_KP_WEIGHTS)

# Status values returned by the checks below.
OK = "OK"
NOT_SCANNED = "Not Scanned"
UNREADABLE = "Unreadable"
MISMATCH = "Mismatch"

#: Statuses that mean "nothing is wrong here".
PASSING = (OK, NOT_SCANNED)

#: Statuses that mean the row should be flagged for human review.
FAILING = (UNREADABLE, MISMATCH)


def _parse_measurement(value: Any) -> int | None:
    """Parse a single OCR'd measurement, rejecting impossible negatives.

    Kill counts, killpoints and power are all non-negative. A negative value
    therefore cannot be a real reading -- it is corruption that must not be
    allowed to participate in arithmetic.
    """
    parsed = to_int_strict(value)
    if parsed is None or parsed < 0:
        return None
    return parsed


def _check_equation(killpoints: Any, tiers: list[tuple[Any, float]]) -> str:
    """Shared body of both killpoint identities."""
    # Nothing was scanned for this row -- absence of data is not a failure.
    if killpoints == SKIPPED or all(value == SKIPPED for value, _ in tiers):
        return NOT_SCANNED

    kp = _parse_measurement(killpoints)
    if kp is None:
        return UNREADABLE

    expected = 0
    for value, weight in tiers:
        parsed = _parse_measurement(value)
        if parsed is None:
            # At least one input was never read, so the identity is untestable.
            # Reporting OK here is what let bad rows through before.
            return UNREADABLE
        expected += math.floor(parsed * weight)

    return OK if kp == expected else MISMATCH


def check_kills_equation(killpoints: Any, tier_kills: list[Any]) -> str:
    """``killpoints == sum(floor(tier_kills * weight))``."""
    return _check_equation(
        killpoints,
        [
            (value, weight)
            for value, (_, weight) in zip(tier_kills, TIER_KP_WEIGHTS, strict=True)
        ],
    )


def check_killpoints_equation(killpoints: Any, tier_kp: list[Any]) -> str:
    """``killpoints == sum(tier_kp)``."""
    return _check_equation(killpoints, [(value, 1.0) for value in tier_kp])


def killpoints_residual(killpoints: Any, tier_kp: list[Any]) -> int | None:
    """Absolute gap in ``killpoints == sum(tier_kp)``.

    Returns None when any input is unreadable, so callers can distinguish
    "these disagree" from "these cannot be compared".
    """
    if killpoints == SKIPPED or all(value == SKIPPED for value in tier_kp):
        return 0
    kp = _parse_measurement(killpoints)
    parsed = [_parse_measurement(value) for value in tier_kp]
    if kp is None or any(value is None for value in parsed):
        return None
    return abs(kp - sum(parsed))


def tier_total(values: list[Any]) -> str:
    """Sum tier readings for a derived column.

    Returns ``"Skipped"`` when nothing was scanned and ``"Unknown"`` when any
    component could not be read -- previously these collapsed to ``0``, which
    shipped a plausible-looking but fabricated "Total Kills" to the spreadsheet.
    """
    if all(value == SKIPPED for value in values):
        return SKIPPED
    parsed = [_parse_measurement(value) for value in values]
    if any(value is None for value in parsed):
        return UNKNOWN
    return str(sum(parsed))


def summarise(statuses: list[str]) -> str:
    """Collapse several check statuses into one row-level verdict."""
    for status in FAILING:
        if status in statuses:
            return status
    if statuses and all(status == NOT_SCANNED for status in statuses):
        return NOT_SCANNED
    return OK
