from roktracker.alliance.ui_settings import AllianceUI
from roktracker.utils.batch_scanner_base import BatchScannerBase


class AllianceScanner(BatchScannerBase):
    scanner_name = "Alliance"
    ui_settings = AllianceUI
    govs_per_screen = 6
    has_last_screen_variant = True
    save_trim_and_sum = False
