from backend.services.sandbox import LocalSandboxExecutor


class _Submission:
    def __init__(self, code: str) -> None:
        self.code = code


def test_local_sandbox_handles_top_level_return():
    executor = LocalSandboxExecutor()
    vulnerable_snippet = (
        'username = request.json["username"]\n'
        'password = request.json["password"]\n'
        "query = f\"SELECT id FROM users WHERE username = '{username}' AND password = '{password}'\"\n"
        "return db.execute(query).fetchone()\n"
    )
    ok, message = executor.run_tests(_Submission(vulnerable_snippet))

    assert ok, message
    assert "succeeded" in message.lower()


def test_local_sandbox_handles_empty_snippet():
    executor = LocalSandboxExecutor()
    ok, message = executor.run_tests(_Submission(""))

    assert ok, message
    assert "succeeded" in message.lower()
