import datetime

from pydantic import BaseModel

from roktracker.utils.general import format_timedelta_to_HHMMSS


class AdditionalData(BaseModel):
    current_governor: int
    target_governor: int
    skipped_governors: int
    power_ok: bool | str
    kills_ok: bool | str
    reconstruction_success: bool | str
    remaining_sec: float
    ch_verification_mode: bool = False
    ch_current_governor: int = 0
    ch_total_governors: int = 0
    current_time: datetime.datetime = datetime.datetime.now().astimezone()
    avg_time_per_governor: float = 0.0
    scan_speed_per_hour: float = 0.0
    elapsed_sec: float = 0.0

    def eta(self) -> str:
        return format_timedelta_to_HHMMSS(
            datetime.timedelta(seconds=self.remaining_sec)
        )
