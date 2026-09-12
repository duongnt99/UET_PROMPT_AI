"""
Locust load tests for AI Arena Viet Nam (production).

Scenarios:
  - public / scoreboard (default mixed)
  - login-ramp: LOGIN ONLY — pre-seeded pool, no registration
  - registration-ramp: registration only — unique email per attempt

Usage:
  locust -f loadtests/locustfile.py --host https://ai-arena-vietnam.uet.edu.vn

Login ramp (50 → 500 users, ~18 min):
  LOADTEST_SCENARIO=login-ramp LOADTEST_SHAPE=auth-ramp \\
    locust -f loadtests/locustfile.py --host https://ai-arena-vietnam.uet.edu.vn --headless \\
    --csv=loadtests/results/login-ramp/stats --html=loadtests/results/login-ramp/report.html

Registration ramp:
  LOADTEST_SCENARIO=registration-ramp \\
    locust -f loadtests/locustfile.py --host https://ai-arena-vietnam.uet.edu.vn --headless \\
    -u 30 -r 5 -t 3m --csv=loadtests/results/registration-ramp/stats
"""
from __future__ import annotations

import os
import re
import uuid
from typing import Optional

from locust import HttpUser, LoadTestShape, between, events, task

HOST = os.getenv("LOADTEST_HOST", "https://ai-arena-vietnam.uet.edu.vn")
LOADTEST_PASSWORD = os.getenv("LOADTEST_PASSWORD", "LoadTestPass123!")
LOADTEST_EMAIL_PREFIX = os.getenv("LOADTEST_EMAIL_PREFIX", "loadtest-20260910")
LOADTEST_POOL_SIZE = int(os.getenv("LOADTEST_POOL_SIZE", "500"))
REGISTRATION_COUNTER = 0


def _discover_register_action_id(client) -> Optional[str]:
    response = client.get("/dang-ky", name="GET /dang-ky [discover action]")
    if response.status_code != 200:
        return None

    # Next.js 16: page chunk path is embedded in RSC flight payload, not always as a script src.
    chunk_match = re.search(
        r"static/chunks/app/\(public\)/dang-ky/page-[^\"\\]+\.js",
        response.text,
    )
    if not chunk_match:
        legacy = re.search(
            r"(/_next/static/chunks/app/\(public\)/dang-ky/page-[^\"']+\.js)",
            response.text,
        )
        chunk_path = legacy.group(1) if legacy else None
    else:
        chunk_path = f"/_next/{chunk_match.group(0)}"

    if not chunk_path:
        return None

    chunk = client.get(chunk_path, name="GET /dang-ky chunk")
    if chunk.status_code != 200:
        return None

    action_match = re.search(
        r'createServerReference\)\("([0-9a-f]{40,64})"',
        chunk.text,
    )
    return action_match.group(1) if action_match else None


@events.init.add_listener
def on_locust_init(environment, **_kwargs):
    if environment.host:
        return
    environment.host = HOST


class PublicVisitor(HttpUser):
    wait_time = between(0.5, 2.0)
    weight = 3

    @task(5)
    def home(self):
        self.client.get("/", name="GET /")

    @task(3)
    def rules(self):
        self.client.get("/the-le", name="GET /the-le")

    @task(2)
    def faq(self):
        self.client.get("/faq", name="GET /faq")

    @task(2)
    def schedule(self):
        self.client.get("/lich-trinh", name="GET /lich-trinh")

    @task(2)
    def news(self):
        self.client.get("/tin-tuc", name="GET /tin-tuc")

    @task(1)
    def guide(self):
        self.client.get(
            "/tin-tuc/huong-dan-dang-ky-va-audition",
            name="GET /tin-tuc/huong-dan-dang-ky-va-audition",
        )


class PublicApiClient(HttpUser):
    wait_time = between(0.2, 1.0)
    weight = 2

    @task(4)
    def health(self):
        with self.client.get("/api/health", name="GET /api/health", catch_response=True) as response:
            if response.status_code != 200:
                response.failure(f"status {response.status_code}")
                return
            try:
                payload = response.json()
            except Exception as exc:  # noqa: BLE001
                response.failure(str(exc))
                return
            if payload.get("status") != "ok":
                response.failure(f"unhealthy payload: {payload}")

    @task(3)
    def competition(self):
        self.client.get("/api/public/competition", name="GET /api/public/competition")

    @task(2)
    def timeline(self):
        self.client.get("/api/public/timeline", name="GET /api/public/timeline")

    @task(2)
    def event_state(self):
        self.client.get("/api/public/event-state", name="GET /api/public/event-state")

    @task(1)
    def finalists(self):
        self.client.get("/api/public/finalists", name="GET /api/public/finalists")


class ScoreboardSurgeUser(HttpUser):
    wait_time = between(0.1, 0.8)
    weight = 4

    @task(6)
    def scoreboard_api(self):
        self.client.get("/api/public/scoreboard", name="GET /api/public/scoreboard")

    @task(4)
    def scoreboard_page(self):
        self.client.get("/scoreboard", name="GET /scoreboard")

    @task(3)
    def event_state(self):
        self.client.get("/api/public/event-state", name="GET /api/public/event-state")

    @task(2)
    def home(self):
        self.client.get("/", name="GET / [scoreboard surge]")


class LoginRampUser(HttpUser):
    """LOGIN ONLY — uses pre-seeded pool; no registration."""

    wait_time = between(0.3, 1.5)
    weight = 10

    def on_start(self):
        index = (id(self) % LOADTEST_POOL_SIZE) + 1
        self.email = f"{LOADTEST_EMAIL_PREFIX}-pool-{index:02d}@example.com"
        self.logged_in = self._login(self.email, LOADTEST_PASSWORD)

    def _login(self, email: str, password: str) -> bool:
        csrf = self.client.get("/api/auth/csrf", name="GET /api/auth/csrf [login ramp]").json()["csrfToken"]
        with self.client.post(
            "/api/auth/callback/credentials",
            data={
                "csrfToken": csrf,
                "email": email,
                "password": password,
                "callbackUrl": f"{self.host}/dashboard",
                "json": "true",
            },
            name="POST /api/auth/callback/credentials [login ramp]",
            catch_response=True,
        ) as response:
            if response.status_code not in (200, 302):
                response.failure(f"status {response.status_code}")
                return False
            response.success()
            return True

    @task(8)
    def relogin(self):
        self._login(self.email, LOADTEST_PASSWORD)

    @task(2)
    def login_page(self):
        self.client.get("/dang-nhap", name="GET /dang-nhap [login ramp]")


class RegistrationRampUser(HttpUser):
    """Registration only — unique email per attempt (deterministic counter + UUID)."""

    wait_time = between(0.5, 2.0)
    weight = 10

    def on_start(self):
        global REGISTRATION_COUNTER
        REGISTRATION_COUNTER += 1
        self.seq = REGISTRATION_COUNTER
        self.register_action_id = _discover_register_action_id(self.client)

    @task(5)
    def register_attempt(self):
        if not self.register_action_id:
            self.register_action_id = _discover_register_action_id(self.client)
        if not self.register_action_id:
            return

        email = f"{LOADTEST_EMAIL_PREFIX}-reg-{self.seq:06d}-{uuid.uuid4().hex[:8]}@example.com"
        files = {
            "email": (None, email),
            "password": (None, LOADTEST_PASSWORD),
            "confirmPassword": (None, LOADTEST_PASSWORD),
        }
        with self.client.post(
            "/dang-ky",
            files=files,
            headers={
                "Next-Action": self.register_action_id,
                "Accept": "text/x-component",
                "Origin": self.host,
                "Referer": f"{self.host}/dang-ky",
            },
            name="POST /dang-ky [register ramp]",
            catch_response=True,
        ) as response:
            if response.status_code >= 500:
                response.failure(f"unexpected status {response.status_code}")
            elif response.status_code in (200, 204, 303):
                response.success()
            elif '"ok":false' in response.text or "đã được sử dụng" in response.text:
                response.success()
            else:
                response.failure(f"status {response.status_code}")

    @task(1)
    def register_page(self):
        self.client.get("/dang-ky", name="GET /dang-ky [registration ramp]")


class AuthFunnelUser(HttpUser):
    """Legacy mixed auth funnel — avoid for benchmarks; use login-ramp / registration-ramp."""

    wait_time = between(0.3, 1.5)
    weight = 3

    def on_start(self):
        self.email = f"{LOADTEST_EMAIL_PREFIX}-{uuid.uuid4().hex[:10]}@example.com"
        self.register_action_id = _discover_register_action_id(self.client)

    @task(4)
    def register_page(self):
        self.client.get("/dang-ky", name="GET /dang-ky")

    @task(4)
    def login_page(self):
        self.client.get("/dang-nhap", name="GET /dang-nhap")

    @task(3)
    def failed_login(self):
        csrf = self.client.get("/api/auth/csrf", name="GET /api/auth/csrf").json()["csrfToken"]
        with self.client.post(
            "/api/auth/callback/credentials",
            data={
                "csrfToken": csrf,
                "email": self.email,
                "password": "WrongPassword123!",
                "callbackUrl": f"{self.host}/",
                "json": "true",
            },
            name="POST /api/auth/callback/credentials [failed]",
            catch_response=True,
        ) as response:
            if response.status_code not in (200, 302):
                response.failure(f"status {response.status_code}")

    @task(2)
    def register_attempt(self):
        if not self.register_action_id:
            return
        email = f"{LOADTEST_EMAIL_PREFIX}-{uuid.uuid4().hex[:10]}@example.com"
        files = {
            "email": (None, email),
            "password": (None, LOADTEST_PASSWORD),
            "confirmPassword": (None, LOADTEST_PASSWORD),
        }
        with self.client.post(
            "/dang-ky",
            files=files,
            headers={
                "Next-Action": self.register_action_id,
                "Accept": "text/x-component",
                "Origin": self.host,
                "Referer": f"{self.host}/dang-ky",
            },
            name="POST /dang-ky [register action]",
            catch_response=True,
        ) as response:
            if response.status_code >= 500:
                response.failure(f"status {response.status_code}")
            elif '"ok":true' in response.text or "Đã tạo tài khoản" in response.text:
                response.success()
            elif response.status_code in (200, 204):
                response.success()


class AuthenticatedUser(HttpUser):
    wait_time = between(0.5, 2.0)
    weight = 3

    def on_start(self):
        index = (id(self) % LOADTEST_POOL_SIZE) + 1
        self.email = f"{LOADTEST_EMAIL_PREFIX}-pool-{index:02d}@example.com"
        self.logged_in = self._login(self.email, LOADTEST_PASSWORD)
        if not self.logged_in:
            self.email = "locust-probe-20260910@example.com"
            self.logged_in = self._login(self.email, LOADTEST_PASSWORD)

    def _login(self, email: str, password: str) -> bool:
        csrf = self.client.get("/api/auth/csrf", name="GET /api/auth/csrf [auth user]").json()["csrfToken"]
        response = self.client.post(
            "/api/auth/callback/credentials",
            data={
                "csrfToken": csrf,
                "email": email,
                "password": password,
                "callbackUrl": f"{self.host}/dashboard",
                "json": "true",
            },
            name="POST /api/auth/callback/credentials [success]",
        )
        return response.status_code in (200, 302)

    @task(4)
    def scoreboard_api(self):
        self.client.get("/api/public/scoreboard", name="GET /api/public/scoreboard [auth]")

    @task(3)
    def scoreboard_page(self):
        self.client.get("/scoreboard", name="GET /scoreboard [auth]")

    @task(2)
    def dashboard(self):
        self.client.get("/dashboard", name="GET /dashboard")

    @task(2)
    def event_state(self):
        self.client.get("/api/public/event-state", name="GET /api/public/event-state [auth]")

    @task(1)
    def relogin(self):
        self._login(self.email, LOADTEST_PASSWORD)


class ScoreboardBurstUser(HttpUser):
    wait_time = between(0.05, 0.2)
    weight = 10

    @task(7)
    def scoreboard_api(self):
        self.client.get("/api/public/scoreboard", name="GET /api/public/scoreboard [burst]")

    @task(3)
    def scoreboard_page(self):
        self.client.get("/scoreboard", name="GET /scoreboard [burst]")


def _apply_scenario_filter() -> None:
    scenario = os.getenv("LOADTEST_SCENARIO", "").strip()
    if not scenario:
        return
    allowed = {
        "auth": {"AuthFunnelUser", "AuthenticatedUser"},
        "login-ramp": {"LoginRampUser"},
        "registration-ramp": {"RegistrationRampUser"},
        "scoreboard": {"ScoreboardSurgeUser", "ScoreboardBurstUser"},
        "public": {"PublicVisitor", "PublicApiClient"},
    }.get(scenario, set())
    for name, value in list(globals().items()):
        if not isinstance(value, type) or not issubclass(value, HttpUser) or value is HttpUser:
            continue
        if name not in allowed:
            value.abstract = True


_apply_scenario_filter()

_LOADTEST_SHAPE = os.getenv("LOADTEST_SHAPE", "")

if _LOADTEST_SHAPE == "ramp":
    class RampUpThenSustainShape(LoadTestShape):
        stages = [
            {"duration": 120, "users": 60, "spawn_rate": 10},
            {"duration": 420, "users": 60, "spawn_rate": 10},
            {"duration": 540, "users": 100, "spawn_rate": 10},
            {"duration": 720, "users": 100, "spawn_rate": 10},
        ]

        def tick(self):
            run_time = self.get_run_time()
            for stage in self.stages:
                if run_time < stage["duration"]:
                    return (stage["users"], stage["spawn_rate"])
            return None

if _LOADTEST_SHAPE == "auth-ramp":
    class AuthRampFiftyToFiveHundredShape(LoadTestShape):
        """Ramp concurrent users from 50 to 500 over ~18 minutes."""

        stages = [
            {"duration": 120, "users": 50, "spawn_rate": 10},
            {"duration": 300, "users": 150, "spawn_rate": 15},
            {"duration": 480, "users": 300, "spawn_rate": 15},
            {"duration": 660, "users": 500, "spawn_rate": 20},
            {"duration": 1080, "users": 500, "spawn_rate": 20},
        ]

        def tick(self):
            run_time = self.get_run_time()
            for stage in self.stages:
                if run_time < stage["duration"]:
                    return (stage["users"], stage["spawn_rate"])
            return None
