from roktracker.honor.ui_settings import HonorUI
from roktracker.utils.batch_scanner_base import BatchScannerBase


class HonorScanner(BatchScannerBase):
    scanner_name = "Honor"
    ui_settings = HonorUI
    govs_per_screen = 5
    has_last_screen_variant = False
    save_trim_and_sum = False
