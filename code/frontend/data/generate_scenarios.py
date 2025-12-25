import csv
from dataclasses import dataclass
from pathlib import Path
from typing import List


BASE_DIR = Path(__file__).resolve().parent / "scenarios"


@dataclass
class RainShape:
    name: str
    base: float
    peak: float
    rise_start: int
    rise_end: int
    fall_end: int


def build_series(shape: RainShape, hours: int = 24) -> List[float]:
    values = []
    for h in range(hours):
        if h < shape.rise_start:
            val = shape.base
        elif shape.rise_start <= h <= shape.rise_end:
            span = shape.rise_end - shape.rise_start + 1
            val = shape.base + (shape.peak - shape.base) * ((h - shape.rise_start) / span)
        elif shape.rise_end < h <= shape.fall_end:
            span = shape.fall_end - shape.rise_end + 1
            val = shape.peak - (shape.peak - shape.base) * ((h - shape.rise_end) / span)
        else:
            val = max(shape.base * 0.6, 0.0)
        values.append(round(val, 2))
    return values


def write_csv(name: str, values: List[float]):
    path = BASE_DIR / f"{name}.csv"
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["timestamp", "rain_mm"])
        for idx, val in enumerate(values):
            writer.writerow([f"2024-07-01 {idx:02d}:00", val])


def main():
    shapes = [
        RainShape("weak", base=0.2, peak=1.0, rise_start=6, rise_end=10, fall_end=16),
        RainShape("medium", base=1.5, peak=6.0, rise_start=4, rise_end=11, fall_end=18),
        RainShape("strong", base=5.0, peak=60.0, rise_start=3, rise_end=8, fall_end=16),
    ]
    for shape in shapes:
        series = build_series(shape)
        write_csv(shape.name, series)
    print("Synthetic scenarios written to", BASE_DIR)


if __name__ == "__main__":
    main()



