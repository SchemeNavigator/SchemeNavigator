def parse_multi_value_field(raw_value: str) -> list[str]:
    value = raw_value.strip()
    if not value:
        return []

    separators = ["|", ";", ","]
    for separator in separators:
        if separator in value:
            return [item.strip() for item in value.split(separator) if item.strip()]
    return [value]
