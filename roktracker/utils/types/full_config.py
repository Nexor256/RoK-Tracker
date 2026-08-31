from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class TimingsConfig(BaseModel):
    gov_open: float = Field(default=2.0, ge=0)
    copy_wait: float = Field(default=0.2, ge=0)
    kills_open: float = Field(default=1.0, ge=0)
    info_open: float = Field(default=1.0, ge=0)
    info_close: float = Field(default=0.5, ge=0)
    gov_close: float = Field(default=1.0, ge=0)
    max_random: float = Field(default=0.5, ge=0)


class FormatsConfig(BaseModel):
    xlsx: bool = True
    csv: bool = False
    jsonl: bool = False

    def from_list(self, list: List[str]):
        for item in list:
            if item == "xlsx":
                self.xlsx = True
            elif item == "csv":
                self.csv = True
            elif item == "jsonl":
                self.jsonl = True

    def from_dict(self, dict: Dict[str, bool]):
        for key, value in dict.items():
            if key == "xlsx":
                self.xlsx = value
            elif key == "csv":
                self.csv = value
            elif key == "jsonl":
                self.jsonl = value


class ScanConfig(BaseModel):
    kingdom_name: str = ""
    people_to_scan: int = Field(default=300, ge=1)
    resume: bool = False
    advanced_scroll: bool = True
    track_inactives: bool = False
    validate_power: bool = False
    power_threshold: int = Field(default=100000, ge=0)
    validate_kills: bool = True
    reconstruct_kills: bool = True
    check_cityhall: bool = False
    ch_auto_assign_power: int = Field(default=25_000_000, ge=0)
    timings: TimingsConfig
    formats: FormatsConfig


class BluestacksConfig(BaseModel):
    name: str = "RoK Tracker"
    config: str = "C:\\ProgramData\\BlueStacks_nxt\\bluestacks.conf"


class GeneralConfig(BaseModel):
    emulator: Literal["bluestacks", "ld", "memu", "nox"] = "bluestacks"
    bluestacks: BluestacksConfig
    adb_port: int = Field(default=5555, ge=1, le=65535)


class FullConfig(BaseModel):
    scan: ScanConfig
    general: GeneralConfig
