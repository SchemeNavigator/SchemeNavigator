from pathlib import Path
import sys

import pytest
from fastapi.testclient import TestClient


BACKEND_ROOT = Path(__file__).resolve().parents[3]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


@pytest.fixture()
def sample_csv_path(tmp_path: Path) -> Path:
    csv_path = tmp_path / "schemes.csv"
    csv_path.write_text(
        "scheme_name,slug,details,benefits,eligibility,application,documents,level,schemeCategory,,tags\n"
        'Scholarship for Students,scholarship-for-students,"Support for students in Odisha with passport and academic documents.",Scholarship aid for students and women,Students with valid passport and mark sheets,Apply online with photo and passport details,"Passport photo, Mark sheets, Residence proof",State,Education & Learning,,"Scholarship,Student,Women"\n'
        'Women Skill Support,women-skill-support,"Women and youth in Odisha receive skill development support.",Training and placement support,Women and youth from Odisha,Apply online with identity proof,"Identity proof, Address proof",National,Employment,,"Women,Skill,Youth"\n'
        'Farmer Relief Program,farmer-relief-program,"Financial relief for farmers affected by calamity.",Relief assistance for farmers,Farmers impacted by disaster,Offline application process,"Land record, Identity proof",Union Territory,Agriculture,,"Farmer,Relief"\n',
        encoding="utf-8",
    )
    return csv_path


@pytest.fixture()
def client(sample_csv_path: Path):
    from app.core.app_factory import create_app
    from app.core.config import Settings

    app = create_app(Settings(csv_path=sample_csv_path))
    with TestClient(app) as test_client:
        yield test_client
