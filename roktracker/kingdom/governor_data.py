from dataclasses import dataclass
from roktracker.kingdom import consistency
from roktracker.utils.general import is_string_int, to_int_check, to_int_strict


@dataclass
class GovernorData:
    id: str = "Skipped"
    name: str = "Skipped"
    power: str = "Skipped"
    killpoints: str = "Skipped"
    acclaim: str = "Skipped"
    acclaim_max: str = "Skipped"
    alliance: str = "Skipped"
    t1_kills: str = "Skipped"
    t1_kp: str = "Skipped"
    t2_kills: str = "Skipped"
    t2_kp: str = "Skipped"
    t3_kills: str = "Skipped"
    t3_kp: str = "Skipped"
    t4_kills: str = "Skipped"
    t4_kp: str = "Skipped"
    t5_kills: str = "Skipped"
    t5_kp: str = "Skipped"
    ranged_points: str = "Skipped"
    dead: str = "Skipped"
    rss_assistance: str = "Skipped"
    rss_gathered: str = "Skipped"
    helps: str = "Skipped"

    validation: str = "Not Checked"

    def t45_kills(self) -> str:
        return consistency.tier_total([self.t4_kills, self.t5_kills])

    def total_kills(self) -> str:
        return consistency.tier_total(
            [getattr(self, f"{tier}_kills") for tier in consistency.TIER_NAMES]
        )

    def flag_unknown(self):
        if self.power == "":
            self.power = "Unknown"

        if self.killpoints == "":
            self.killpoints = "Unknown"
        
        if self.acclaim == "":
            self.acclaim = "Unknown"
        
        if self.acclaim_max == "":
            self.acclaim_max = "Unknown"

        if self.t1_kills == "":
            self.t1_kills = "Unknown"

        if self.t2_kills == "":
            self.t2_kills = "Unknown"

        if self.t3_kills == "":
            self.t3_kills = "Unknown"

        if self.t4_kills == "":
            self.t4_kills = "Unknown"

        if self.t5_kills == "":
            self.t5_kills = "Unknown"

        if self.t1_kp == "":
            self.t1_kp = "Unknown"

        if self.t2_kp == "":
            self.t2_kp = "Unknown"

        if self.t3_kp == "":
            self.t3_kp = "Unknown"

        if self.t4_kp == "":
            self.t4_kp = "Unknown"

        if self.t5_kp == "":
            self.t5_kp = "Unknown"

        if self.ranged_points == "":
            self.ranged_points = "Unknown"

        if self.dead == "":
            self.dead = "Unknown"

        if self.rss_gathered == "":
            self.rss_gathered = "Unknown"

        if self.rss_assistance == "":
            self.rss_assistance = "Unknown"

        if self.helps == "":
            self.helps = "Unknown"

    @staticmethod
    def intify_value(value: str) -> int:
        if value == "Unknown":
            return -1
        elif value == "Skipped":
            return -2
        elif not is_string_int(value):
            return -3
        else:
            return int(value)

    def kills_status(self) -> str:
        """Status of ``killpoints == sum(floor(tier_kills * weight))``."""
        return consistency.check_kills_equation(
            self.killpoints,
            [getattr(self, f"{tier}_kills") for tier in consistency.TIER_NAMES],
        )

    def killpoints_status(self) -> str:
        """Status of ``killpoints == sum(tier_kp)``."""
        return consistency.check_killpoints_equation(
            self.killpoints,
            [getattr(self, f"{tier}_kp") for tier in consistency.TIER_NAMES],
        )

    def validation_status(self) -> str:
        """Row-level verdict across every consistency check."""
        return consistency.summarise([self.kills_status(), self.killpoints_status()])

    def validate_kills(self) -> bool:
        return self.kills_status() in consistency.PASSING

    def validate_killpoints(self) -> bool:
        return self.killpoints_status() in consistency.PASSING

    def reconstruct_kills(self) -> bool:
        # Kills can only be reconstructed if the killpoints are trustworthy.
        # validate_killpoints() rejects unreadable inputs, so an OCR failure can
        # no longer be "reconstructed" into a confident wrong number.
        if self.validate_killpoints():
            t1_kp = to_int_strict(self.t1_kp)
            t2_kp = to_int_strict(self.t2_kp)
            t3_kp = to_int_strict(self.t3_kp)
            t4_kp = to_int_strict(self.t4_kp)
            t5_kp = to_int_strict(self.t5_kp)
            if None in (t1_kp, t2_kp, t3_kp, t4_kp, t5_kp):
                return False

            # Tier 1 killpoints imply this kill count. 1/0.2 == 5 is exact in
            # binary floating point for every value this field holds, so int()
            # here cannot truncate.
            kills_t1 = t1_kp / 0.2

            if (
                kills_t1 < t1_kp <= (kills_t1 + 4)
            ):  # fix t1 kills if no error is present
                kills_t1 = t1_kp
            elif (
                kills_t1 % 10 < t1_kp % 10 <= (kills_t1 + 4) % 10
            ):  # try to fix t1 with error (assuming last digit is correct)
                kill_dif_t1 = (t1_kp % 10) - (kills_t1 % 10)
                kills_t1 = kills_t1 + kill_dif_t1

            self.t1_kills = str(int(kills_t1))
            self.t2_kills = str(t2_kp // 2)
            self.t3_kills = str(t3_kp // 4)
            self.t4_kills = str(t4_kp // 10)
            self.t5_kills = str(t5_kp // 20)
            return True
        else:
            return False
