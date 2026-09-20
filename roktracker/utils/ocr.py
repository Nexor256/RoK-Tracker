import cv2
import re
import tesserocr
import numpy as np

from PIL import Image
from cv2.typing import MatLike
from typing import Tuple


def cropToRegion(image: MatLike, roi: Tuple[int, int, int, int]) -> MatLike:
    return image[int(roi[1]) : int(roi[1] + roi[3]), int(roi[0]) : int(roi[0] + roi[2])]


def cropToTextWithBorder(img: MatLike, border_size) -> MatLike:
    coords = cv2.findNonZero(cv2.bitwise_not(img))
    x, y, w, h = cv2.boundingRect(coords)

    roi = img[y : y + h, x : x + w]
    bordered = cv2.copyMakeBorder(
        roi,
        top=border_size,
        bottom=border_size,
        left=border_size,
        right=border_size,
        borderType=cv2.BORDER_CONSTANT,
        value=[255],
    )

    return bordered


def preprocessImage(
    image: MatLike,
    scale_factor: int,
    threshold: int,
    border_size: int,
    invert: bool = False,
) -> MatLike:
    if image is None or image.size == 0:
        return np.zeros((1, 1), dtype=np.uint8)
    im_big = cv2.resize(image, (0, 0), fx=scale_factor, fy=scale_factor)
    im_gray = cv2.cvtColor(im_big, cv2.COLOR_BGR2GRAY)
    if invert:
        im_gray = cv2.bitwise_not(im_gray)
    (thresh, im_bw) = cv2.threshold(im_gray, threshold, 255, cv2.THRESH_BINARY)
    im_bw = cropToTextWithBorder(im_bw, border_size)
    return im_bw


def preprocessImageRobust(
    image: MatLike,
    scale_factor: int,
    threshold: int,
    border_size: int,
    invert: bool = False,
) -> MatLike:
    """Enhanced preprocessing using HSV color masking to handle themed backgrounds.

    On themed governor profiles (e.g. Colosseum, Arena), colorful background
    pixels survive simple grayscale thresholding and create OCR noise.  This
    function converts to the HSV color space first and builds a mask that keeps
    only bright, low-saturation pixels — i.e. the white / light game-text —
    before binarising.  Falls back to the legacy path when the input is already
    single-channel.
    """
    if image is None or image.size == 0:
        return np.zeros((1, 1), dtype=np.uint8)
    im_big = cv2.resize(image, (0, 0), fx=scale_factor, fy=scale_factor)

    if len(im_big.shape) == 3 and im_big.shape[2] >= 3:
        # --- colour image: use HSV masking ---
        hsv = cv2.cvtColor(im_big, cv2.COLOR_BGR2HSV)
        v_channel = hsv[:, :, 2]
        s_channel = hsv[:, :, 1]

        # Keep bright, low-saturation pixels (white / light text)
        bright_mask = cv2.inRange(v_channel, np.array(180), np.array(255))
        low_sat_mask = cv2.inRange(s_channel, np.array(0), np.array(60))
        text_mask = cv2.bitwise_and(bright_mask, low_sat_mask)

        gray = cv2.cvtColor(im_big, cv2.COLOR_BGR2GRAY)
        masked = cv2.bitwise_and(gray, gray, mask=text_mask)

        # Invert so text becomes black-on-white (Tesseract default)
        im_bw = cv2.bitwise_not(masked)
        # Clean-up threshold
        (_, im_bw) = cv2.threshold(im_bw, threshold, 255, cv2.THRESH_BINARY)
    else:
        # --- grayscale fallback (same as preprocessImage) ---
        im_gray = im_big if len(im_big.shape) == 2 else cv2.cvtColor(im_big, cv2.COLOR_BGR2GRAY)
        if invert:
            im_gray = cv2.bitwise_not(im_gray)
        (_, im_bw) = cv2.threshold(im_gray, threshold, 255, cv2.THRESH_BINARY)

    im_bw = cropToTextWithBorder(im_bw, border_size)
    return im_bw


def ocr_number(api: tesserocr.PyTessBaseAPI, image: MatLike, empty_retry: bool = False):
    api.SetImage(Image.fromarray(image))  # type: ignore
    score_raw = api.GetUTF8Text()
    score = re.sub("[^0-9]", "", score_raw)

    if score == "" and empty_retry:
        img_try_2 = cv2.resize(image, (0, 0), fx=0.5, fy=0.5, interpolation=cv2.INTER_AREA)
        api.SetImage(Image.fromarray(img_try_2))  # type: ignore
        score_raw = api.GetUTF8Text()
        score = re.sub("[^0-9]", "", score_raw)

    if not score:
        return "Unknown"
    return score


def ocr_text(api, image: MatLike):
    api.SetImage(Image.fromarray(image))
    name = api.GetUTF8Text()
    return name.rstrip("\n")


def clean_alliance_name(raw: str) -> str:
    """Fix background-noise errors at the start of the alliance OCR result.

    Two failure modes on busy themed backgrounds:
    - an extra hallucinated char before the tag
    - the "[" itself misread
    Alliance tags start with "[" or an alphanumeric, so strip other leading
    noise chars, then repair a leading "{" (drop it before a real "[",
    otherwise it IS the misread bracket).
    """
    if not raw:
        return raw
    cleaned = re.sub(r"^[(\<\|/\\'\"\s]+", "", raw)
    if cleaned.startswith("{["):
        cleaned = cleaned[1:]
    elif cleaned.startswith("{") and len(cleaned) > 1:
        cleaned = "[" + cleaned[1:]
    return cleaned if cleaned else raw


def _remove_counter_speckles(bw: MatLike) -> MatLike:
    """Remove blobs trapped inside glyph counters from a binarised ID image.

    The image must be black-text-on-white (the output of preprocessImage*).
    Background texture that survives thresholding can leave dots inside the
    enclosed counter of a "0", making Tesseract read it. Digits and parens never have
    anything inside their counters, so any small text component that lies
    fully within an enclosed background region is speckle and is painted back to background white.
    """
    try:
        inverted = cv2.bitwise_not(bw)  # text -> white blobs
        n, labels, stats, _ = cv2.connectedComponentsWithStats(
            inverted, connectivity=8
        )
        if n <= 1:
            return bw

        # Background regions (bw == 255): the outer page background touches
        # the image border; glyph counters don't.
        bg_n, bg_labels, bg_stats, _ = cv2.connectedComponentsWithStats(
            (bw == 255).astype(np.uint8), connectivity=8
        )
        img_h, img_w = bw.shape[:2]
        hole_ids = set()
        for i in range(1, bg_n):
            x = bg_stats[i, cv2.CC_STAT_LEFT]
            y = bg_stats[i, cv2.CC_STAT_TOP]
            w = bg_stats[i, cv2.CC_STAT_WIDTH]
            h = bg_stats[i, cv2.CC_STAT_HEIGHT]
            if x > 0 and y > 0 and x + w < img_w and y + h < img_h:
                hole_ids.add(i)
        if not hole_ids:
            return bw

        # Glyph size reference: median of the three largest components.
        areas = np.sort(stats[1:, cv2.CC_STAT_AREA].astype(float))[::-1]
        reference = (
            float(np.median(areas[:3])) if len(areas) >= 3 else float(areas[0])
        )

        result = bw.copy()
        for idx in range(1, n):
            area = stats[idx, cv2.CC_STAT_AREA]
            if area >= 0.8 * reference:
                continue  # a glyph, not a speckle
            cx = stats[idx, cv2.CC_STAT_LEFT] + stats[idx, cv2.CC_STAT_WIDTH] // 2
            cy = stats[idx, cv2.CC_STAT_TOP] + stats[idx, cv2.CC_STAT_HEIGHT] // 2
            if bg_labels[cy, cx] in hole_ids:
                result[labels == idx] = 255
        return result
    except Exception:
        return bw



def _ocr_digits_with_whitelist(api, image: MatLike) -> str:
    """OCR a binarised image restricted to digits/parens (used for governor IDs).

    The parens are included in the whitelist so a trailing ")" OCRs as ")"
    (later stripped) instead of being forced into a hallucinated digit.
    """
    try:
        api.SetVariable("tessedit_char_whitelist", "0123456789()")
    except Exception:
        pass
    try:
        api.SetImage(Image.fromarray(image))  # type: ignore
        raw = api.GetUTF8Text()
        digits = re.sub("[^0-9]", "", raw)
        if not digits:
            small = cv2.resize(
                image, (0, 0), fx=0.5, fy=0.5, interpolation=cv2.INTER_AREA
            )
            api.SetImage(Image.fromarray(small))  # type: ignore
            raw = api.GetUTF8Text()
            digits = re.sub("[^0-9]", "", raw)
        return digits
    finally:
        try:
            api.SetVariable("tessedit_char_whitelist", "")
        except Exception:
            pass


def _len_plausibility_rank(length: int) -> int:
    """Rank ID-length plausibility: 8-9 digits best, 7 next, short/long worse."""
    if length in (8, 9):
        return 0
    if length == 7:
        return 1
    if length < 7:
        return 2
    return 3  # 10+ digits: likely a paren/background hallucination


def _vote_id_candidates(
    candidates: list[tuple[str, int]], legacy_result: str, min_valid_len: int
) -> str:
    """Combine weighted OCR readings of the governor ID into one result.

    Whole-string counting is fragile: if every variant inherits the same
    single-digit corruption (a speckle-filled "0" reading as "9"/"8"),
    counting can only pick between full strings that each carry one bad
    digit.  Two mechanisms fix this:

    1. Tiered consensus — readings from cleaner binarisations (de-speckled,
       colour-masked; higher weight) are trusted exclusively while they
       agree with each other on a plausible-length string.  Rawer readings
       only join the decision when cleaner ones disagree or look like
       hallucinations.
    2. If the tiers don't settle it, candidates are grouped by length
       (plausible 7-9 digit lengths first, regardless of weight — 10+
       readings are paren/background hallucinations) and voted per digit
       position with per-variant confidence weights.  A composite string
       that no variant actually produced is only accepted when it is within
       2 digits of a real reading; otherwise the strongest whole reading
       wins.  Returns "" when nothing plausible was found.
    """
    from collections import Counter, defaultdict

    valid = [(d, w) for d, w in candidates if d]
    if not valid:
        return ""

    # --- tiered consensus over cleaner readings -----------------------------
    weights = sorted({w for _, w in valid}, reverse=True)
    for cutoff in weights:
        tier = [d for d, w in valid if w >= cutoff]
        distinct = set(tier)
        if len(distinct) == 1:
            d = next(iter(distinct))
            if _len_plausibility_rank(len(d)) <= 1:
                return d

    # --- per-position weighted vote across all readings ---------------------
    by_len: dict[int, list[tuple[str, int]]] = defaultdict(list)
    for d, w in valid:
        by_len[len(d)].append((d, w))

    # Plausible 7-9 digit lengths always outrank implausible ones (even a
    # high-weight 10+ digit hallucination); then most confident group wins,
    # then groups with more variants, then the shorter length (extra digits
    # are usually hallucinations).
    best_len = sorted(
        by_len,
        key=lambda n: (
            _len_plausibility_rank(n) > 1,
            -sum(w for _, w in by_len[n]),
            _len_plausibility_rank(n),
            -len(by_len[n]),
            n,
        ),
    )[0]
    group = by_len[best_len]

    top_weight = max(w for _, w in group)
    top_readings = [d for d, w in group if w == top_weight]

    # Per-position weighted vote.  Ties prefer the digit read by the most
    # confident variants, then "0" (a speckle filling a "0" loop turns it
    # into "9"/"8"; the reverse — losing part of a solid stroke — is rarer),
    # then the lower digit for determinism.
    composite_chars: list[str] = []
    for i in range(best_len):
        votes: Counter = Counter()
        for d, w in group:
            votes[d[i]] += w
        digit = sorted(
            votes,
            key=lambda ch: (
                -votes[ch],
                0 if all(ch == t[i] for t in top_readings) else 1,
                0 if ch == "0" else 1,
                ch,
            ),
        )[0]
        # Counter-fill repair: the game renders IDs in pure white, so glyph
        # strokes always binarise cleanly and the only in-glyph corruption is
        # bright background pixels filling a glyph's enclosed counter — which
        # turns "0" into "6"/"8"/"9".  When "0" has solid support and every
        # higher-voted digit at this position is one of those confusions, the
        # position is really a "0".
        zero_votes = votes.get("0", 0)
        if zero_votes >= 3 and digit in "689":
            if all(d in "689" for d, v in votes.items() if v > zero_votes):
                digit = "0"
        composite_chars.append(digit)
    result = "".join(composite_chars)

    known = {d for d, _ in group}
    if result not in known:
        min_diff = min(sum(a != b for a, b in zip(d, result)) for d in known)
        if min_diff > 2:
            # The composite is not close to anything actually read; trust the
            # strongest whole reading (legacy tie-break keeps runs
            # deterministic).
            result = sorted(
                group,
                key=lambda dw: (-dw[1], 0 if dw[0] == legacy_result else 1, dw[0]),
            )[0][0]

    if len(result) < min_valid_len:
        return ""
    return result



def ocr_governor_id(
    api, crop: MatLike, border_size: int = 12, min_valid_len: int = 5
) -> str:
    """Multi-pass OCR for the governor ID field.

    Themed profiles (e.g. autumn) use a bright yellow background where white
    text has almost no grayscale contrast, so a fixed threshold (120) binarises
    everything to black and only fragments like "57" survive. Otsu thresholding
    adapts to the background, and the blue channel separates white text from
    yellow/red backgrounds where grayscale fails.

    On busy backgrounds (e.g. the Colosseum crowd) texture speckle can land
    inside a "0" loop so it reads as "9"/"8". 
    The legacy reading is therefore only trusted outright when a speckle-cleaned
    variant confirms it; otherwise every binarisation is OCR'd with a digit/
    paren whitelist and combined with a confidence-weighted per-position vote
    (see _vote_id_candidates) so one noisy digit cannot win by length. Returns
    "Unknown" instead of a corrupt short ID when nothing plausible is found.
    """
    try:
        from tesserocr import PSM as _PSM  # type: ignore

        single_line = _PSM.SINGLE_LINE
    except Exception:
        single_line = 7  # PSM.SINGLE_LINE fallback

    try:
        api.SetPageSegMode(single_line)
    except Exception:
        pass

    candidates: list[tuple[str, int]] = []
    legacy_result = ""
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))

    def _ocr_pass(image: MatLike, weight: int, needs_border: bool = True) -> str:
        try:
            bordered = (
                cropToTextWithBorder(image, border_size) if needs_border else image
            )
        except Exception:
            bordered = image
        d = _ocr_digits_with_whitelist(api, bordered)
        if d:
            candidates.append((d, weight))
        return d

    # 1. Legacy path first (fast path for the standard blue theme).  A
    # plausible 8-9 digit reading is only returned immediately when a
    # speckle-cleaned (morphological open) variant confirms it — background
    # texture dots inside a "0" loop otherwise turn "153699403" into
    # "153699493" and the corrupted reading used to win outright on length.
    try:
        bw_legacy = preprocessImage(crop, 3, 120, border_size, True)
        d0 = _ocr_pass(bw_legacy, 1, needs_border=False)
        if d0 and len(d0) in (8, 9):
            try:
                d1 = _ocr_pass(
                    cv2.morphologyEx(bw_legacy, cv2.MORPH_OPEN, kernel),
                    2,
                    needs_border=False,
                )
            except Exception:
                d1 = ""
            try:
                d2 = _ocr_pass(
                    _remove_counter_speckles(bw_legacy), 3, needs_border=False
                )
            except Exception:
                d2 = ""
            if d0 in (d1, d2):
                return d0
        if d0:
            legacy_result = d0
    except Exception:
        pass

    # 2. Otsu variants: grayscale-inverted + each BGR channel, plus a
    # speckle-removal (open) pass over the grayscale image. Background
    # texture (e.g. Colosseum crowd) can leave dots inside a "0" loop so
    # it reads as "9"; opening drops isolated speckle while keeping glyphs.
    # Cleaned variants get a higher vote weight than raw thresholds.
    try:
        if crop is None or getattr(crop, "size", 1) == 0:
            raise ValueError("empty crop")
        big = cv2.resize(crop, (0, 0), fx=3, fy=3)
        otsu_images: list[tuple[MatLike, int]] = []
        if len(big.shape) == 3 and big.shape[2] >= 3:
            gray = cv2.cvtColor(big, cv2.COLOR_BGR2GRAY)
            inv = cv2.bitwise_not(gray)
            (_, bw_gray) = cv2.threshold(
                inv, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU
            )
            otsu_images.append((bw_gray, 1))
            otsu_images.append(
                (cv2.morphologyEx(bw_gray, cv2.MORPH_OPEN, kernel), 2)
            )
            otsu_images.append((_remove_counter_speckles(bw_gray), 3))
            for ch_idx in range(3):
                ch = big[:, :, ch_idx]
                (_, bw_inv) = cv2.threshold(
                    ch, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU
                )
                otsu_images.append((cv2.bitwise_not(bw_inv), 1))
        else:
            gray = big if len(big.shape) == 2 else cv2.cvtColor(big, cv2.COLOR_BGR2GRAY)
            inv = cv2.bitwise_not(gray)
            (_, bw_gray) = cv2.threshold(
                inv, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU
            )
            otsu_images.append((bw_gray, 1))

        for bw, weight in otsu_images:
            _ocr_pass(bw, weight)
    except Exception:
        pass

    # 3. HSV colour-mask variant: keeps only bright, low-saturation pixels so
    # colourful themed backgrounds (Colosseum crowd, arena fire) that survive
    # both the fixed threshold and Otsu are stripped away.
    try:
        bw_hsv = preprocessImageRobust(crop, 3, 150, border_size, True)
        _ocr_pass(bw_hsv, 2, needs_border=False)
        _ocr_pass(_remove_counter_speckles(bw_hsv), 3, needs_border=False)
    except Exception:
        pass

    result = _vote_id_candidates(candidates, legacy_result, min_valid_len)
    if not result:
        return "Unknown"
    return result


def preprocess_and_ocr_number(
    api, image: MatLike, region: Tuple[int, int, int, int], invert: bool = False
):
    cropped_image = cropToRegion(image, region)
    cropped_bw_image = preprocessImage(cropped_image, 3, 150, 12, invert)

    return ocr_number(api, cropped_bw_image)


def preprocess_and_ocr_number_robust(
    api, image: MatLike, region: Tuple[int, int, int, int], invert: bool = False
):
    """Crop, preprocess with HSV masking, and OCR a number region."""
    cropped_image = cropToRegion(image, region)
    cropped_bw_image = preprocessImageRobust(cropped_image, 3, 150, 12, invert)
    return ocr_number(api, cropped_bw_image, empty_retry=True)


def get_supported_langs(path: str) -> str:
    return str(tesserocr.get_languages(path))  # type: ignore


def pil_to_cv2(pil_image) -> MatLike:
    """Convert a PIL Image to an OpenCV numpy array (BGR format)."""
    import numpy as np

    rgb = np.array(pil_image)
    if len(rgb.shape) == 3 and rgb.shape[2] >= 3:
        return cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    return rgb
