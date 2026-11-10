"""Shared validation for profile province and regency pairs."""

from pydantic import BaseModel, Field, model_validator

from app.services.regions import valid_area


class ProfileRegion(BaseModel):
    province_code: str | None = Field(default=None, min_length=2, max_length=2)
    regency_code: str | None = Field(default=None, min_length=5, max_length=5)

    @model_validator(mode="after")
    def validate_region(self):
        if self.province_code is None and self.regency_code is None:
            return self
        if not valid_area(self.province_code, self.regency_code):
            raise ValueError("Pilih provinsi dan kota/kabupaten yang sesuai")
        return self
