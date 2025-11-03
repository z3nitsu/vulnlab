from __future__ import annotations

import importlib
import pytest
from fastapi.testclient import TestClient
import warnings

warnings.filterwarnings(
    "ignore",
    message="Please use `import python_multipart` instead.",
    category=PendingDeprecationWarning,
)


@pytest.fixture()
def client(tmp_path, monkeypatch) -> TestClient:
    db_path = tmp_path / "test.db"
    monkeypatch.setenv("VULNLABS_DATABASE_URL", f"sqlite:///{db_path}")
    monkeypatch.setenv("VULNLABS_LOG_LEVEL", "CRITICAL")
    monkeypatch.setenv("VULNLABS_API_KEY", "test-key")

    from backend import config

    config.get_settings.cache_clear()

    # Reload modules that depend on settings to pick up the test configuration.
    import backend.db as db_module
    importlib.reload(db_module)
    import sys
    sys.modules.pop("backend.models", None)
    import backend.models as models_module
    import backend.db_init as db_init
    importlib.reload(db_init)

    # Ensure sandbox/worker modules pick up the reloaded settings.
    sys.modules.pop("backend.services.worker", None)
    sys.modules.pop("backend.services.sandbox", None)

    settings = config.get_settings()
    db_init.init_db(settings)

    import backend.app as app_module
    importlib.reload(app_module)

    app = app_module.create_app(settings)

    with TestClient(app) as test_client:
        test_client.headers.update({"X-API-Key": "test-key"})
        yield test_client
