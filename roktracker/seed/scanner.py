from roktracker.seed.ui_settings import KingdomUI
from roktracker.utils.batch_scanner_base import BatchScannerBase


class SeedScanner(BatchScannerBase):
    scanner_name = "Seed"
    ui_settings = KingdomUI
    govs_per_screen = 6
    has_last_screen_variant = True
    save_trim_and_sum = True
