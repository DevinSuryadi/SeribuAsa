"""Age arithmetic shared by growth monitoring and aid eligibility."""

from datetime import date


def age_in_months(birth_date: date, on: date) -> int:
    """Return completed months between ``birth_date`` and ``on``, never negative."""
    months = (on.year - birth_date.year) * 12 + on.month - birth_date.month
    if on.day < birth_date.day:
        months -= 1
    return max(0, months)
