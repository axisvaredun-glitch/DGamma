import json
import ssl
import time
import urllib.request
from pathlib import Path

ctx = ssl.create_default_context()
base = "https://www.emsifa.com/api-wilayah-indonesia/api"
ua = {"User-Agent": "Mozilla/5.0"}
java_ids = ["31", "32", "33", "34", "35", "36"]
out = Path(__file__).resolve().parents[1] / "src" / "data" / "java-kecamatan.json"


def get(path: str):
    req = urllib.request.Request(base + path, headers=ua)
    with urllib.request.urlopen(req, context=ctx, timeout=30) as response:
        return json.load(response)


def tidy(value: str) -> str:
    if value.isupper():
        return " ".join(part.capitalize() for part in value.split())
    return value


provinces = {
    item["id"]: item["name"]
    for item in get("/provinces.json")
    if item["id"] in java_ids
}
print("provinces", provinces)

rows = []
for province_id, province_name in provinces.items():
    regencies = get(f"/regencies/{province_id}.json")
    print(province_name, "regencies", len(regencies))
    for regency in regencies:
        districts = get(f"/districts/{regency['id']}.json")
        for district in districts:
            name = tidy(district["name"])
            city = tidy(regency["name"])
            rows.append(
                {
                    "id": district["id"],
                    "name": name,
                    "regency": city,
                    "province": tidy(province_name),
                    "label": f"{name}, {city}",
                }
            )
        time.sleep(0.04)
    print("  total", len(rows))

out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(rows, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print("WROTE", len(rows), out, "bytes", out.stat().st_size)
