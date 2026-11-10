"""Calendar helpers for Western Indonesian Time (WIB), the program's operating timezone."""

from datetime import date, datetime, timedelta, timezone

WIB = timezone(timedelta(hours=7), "WIB")


def wib_now() -> datetime:
    return datetime.now(WIB)


def wib_today() -> date:
    return wib_now().date()


def wib_midnight_as_utc(day: date) -> datetime:
    """Return 00:00 WIB of ``day`` as a naive UTC datetime, matching stored timestamps."""
    local_midnight = datetime.combine(day, datetime.min.time(), tzinfo=WIB)
    return local_midnight.astimezone(timezone.utc).replace(tzinfo=None)
