from __future__ import annotations

import json
import sys
from pathlib import Path


BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.append(str(BACKEND_ROOT))

from app.schemas.request import AnalyzeRequest
from app.services.analyze_service import analyze


def main() -> None:
    request = AnalyzeRequest()
    response = analyze(request)
    print(json.dumps(response.model_dump(), indent=2))


if __name__ == "__main__":
    main()
