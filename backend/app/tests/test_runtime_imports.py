import subprocess
import sys
from pathlib import Path


def test_backend_runtime_imports_use_real_package_layout():
    backend_root = Path(__file__).resolve().parents[2]
    result = subprocess.run(
        [
            sys.executable,
            "-c",
            (
                "from app.agents.verification.verification_agent import VerificationAgent; "
                "from app.agents.planner.planner_agent import PlannerAgentImpl; "
                "from app.graph.recommendation_node import RecommendationNode; "
                "from main import app; "
                "print('runtime imports ok')"
            ),
        ],
        cwd=backend_root,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr
    assert result.stdout.strip() == "runtime imports ok"
