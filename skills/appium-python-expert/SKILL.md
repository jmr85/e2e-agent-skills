---
name: appium-python-expert
description: >
  Specialist skill for mobile E2E testing with Appium 2.x + Python (pytest) for Android and iOS.
  Use this skill whenever the user asks about: setting up Appium with Python, writing mobile test cases,
  configuring Android/iOS drivers (UIAutomator2, XCUITest), implementing Page Object Model for mobile,
  running tests with pytest, integrating Appium tests with GitHub Actions or Jenkins, troubleshooting
  Appium sessions, capabilities configuration, or any question about mobile test automation in Python.
  Always invoke this skill for phrases like "test móvil", "appium python", "automatización android/ios",
  "pytest appium", "mobile E2E", "capabilities appium", "page object mobile", or any variation.
metadata:
  author: https://github.com/jmr85
  role: specialist
  scope: testing
  output-format: code
---


# Appium Python Expert

Specialist in mobile E2E test automation using **Appium 2.x + Python + pytest**.
Covers Android (UIAutomator2) and iOS (XCUITest), Page Object Model, CI/CD integration.

---

## Stack de referencia

| Layer | Tool |
|---|---|
| Appium | 2.x (drivers plugin-based) |
| Client | `Appium-Python-Client` >= 3.x |
| Test runner | `pytest` + `pytest-html` |
| Android driver | `uiautomator2` |
| iOS driver | `xcuitest` |
| CI/CD | GitHub Actions, Jenkins |
| Utilities | `python-dotenv`, `allure-pytest` (opcional) |

---

## Project Structure (reference)

```
project/
├── tests/
│   ├── android/
│   │   └── test_login_android.py
│   ├── ios/
│   │   └── test_login_ios.py
│   └── conftest.py
├── pages/
│   ├── base_page.py
│   ├── login_page.py
│   └── home_page.py
├── config/
│   ├── capabilities_android.py
│   └── capabilities_ios.py
├── utils/
│   └── helpers.py
├── .env
├── pytest.ini
├── requirements.txt
└── README.md
```

---

## Quick-start guide

### 1. Install Appium 2.x and drivers

```bash
npm install -g appium@latest
appium driver install uiautomator2
appium driver install xcuitest
appium driver list --installed   # verify
```

### 2. Python dependencies (`requirements.txt`)

```
Appium-Python-Client>=3.1.0
pytest>=8.0.0
pytest-html>=4.0.0
python-dotenv>=1.0.0
allure-pytest>=2.13.0   # optional
```

```bash
pip install -r requirements.txt
```

### 3. Environment variables (`.env`)

```env
ANDROID_APP_PATH=/abs/path/to/app.apk
IOS_APP_PATH=/abs/path/to/app.ipa
APPIUM_HOST=127.0.0.1
APPIUM_PORT=4723
ANDROID_DEVICE_NAME=emulator-5554
IOS_DEVICE_NAME=iPhone 15
IOS_PLATFORM_VERSION=17.0
```

---

## Capabilities

### Android (`config/capabilities_android.py`)

```python
import os
from dotenv import load_dotenv

load_dotenv()

ANDROID_CAPS = {
    "platformName": "Android",
    "appium:automationName": "UiAutomator2",
    "appium:deviceName": os.getenv("ANDROID_DEVICE_NAME", "emulator-5554"),
    "appium:app": os.getenv("ANDROID_APP_PATH"),
    "appium:noReset": False,
    "appium:newCommandTimeout": 120,
    "appium:autoGrantPermissions": True,
}
```

### iOS (`config/capabilities_ios.py`)

```python
import os
from dotenv import load_dotenv

load_dotenv()

IOS_CAPS = {
    "platformName": "iOS",
    "appium:automationName": "XCUITest",
    "appium:deviceName": os.getenv("IOS_DEVICE_NAME", "iPhone 15"),
    "appium:platformVersion": os.getenv("IOS_PLATFORM_VERSION", "17.0"),
    "appium:app": os.getenv("IOS_APP_PATH"),
    "appium:noReset": False,
    "appium:newCommandTimeout": 120,
    "appium:autoAcceptAlerts": True,
}
```

---

## conftest.py (driver fixture)

```python
import pytest
from appium import webdriver
from appium.options import AppiumOptions
from config.capabilities_android import ANDROID_CAPS
from config.capabilities_ios import IOS_CAPS
import os

APPIUM_URL = f"http://{os.getenv('APPIUM_HOST','127.0.0.1')}:{os.getenv('APPIUM_PORT','4723')}"

def get_driver(platform: str):
    caps = ANDROID_CAPS if platform == "android" else IOS_CAPS
    options = AppiumOptions().load_capabilities(caps)
    return webdriver.Remote(APPIUM_URL, options=options)

@pytest.fixture(scope="function")
def android_driver():
    driver = get_driver("android")
    yield driver
    driver.quit()

@pytest.fixture(scope="function")
def ios_driver():
    driver = get_driver("ios")
    yield driver
    driver.quit()
```

---

## Page Object Model

### `pages/base_page.py`

```python
from appium.webdriver.common.appiumby import AppiumBy
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class BasePage:
    DEFAULT_TIMEOUT = 15

    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(driver, self.DEFAULT_TIMEOUT)

    def find(self, by, value):
        return self.wait.until(EC.presence_of_element_located((by, value)))

    def click(self, by, value):
        self.find(by, value).click()

    def type_text(self, by, value, text):
        el = self.find(by, value)
        el.clear()
        el.send_keys(text)

    def get_text(self, by, value) -> str:
        return self.find(by, value).text

    def is_visible(self, by, value) -> bool:
        try:
            self.wait.until(EC.visibility_of_element_located((by, value)))
            return True
        except Exception:
            return False

    def swipe_up(self):
        size = self.driver.get_window_size()
        self.driver.swipe(
            size["width"] // 2, int(size["height"] * 0.8),
            size["width"] // 2, int(size["height"] * 0.2),
            duration=500
        )
```

### `pages/login_page.py`

```python
from appium.webdriver.common.appiumby import AppiumBy
from pages.base_page import BasePage

class LoginPage(BasePage):
    # Android locators (UIAutomator2)
    USERNAME_FIELD  = (AppiumBy.ACCESSIBILITY_ID, "username_input")
    PASSWORD_FIELD  = (AppiumBy.ACCESSIBILITY_ID, "password_input")
    LOGIN_BUTTON    = (AppiumBy.ACCESSIBILITY_ID, "login_button")
    ERROR_MESSAGE   = (AppiumBy.ID, "com.example.app:id/error_text")

    def login(self, username: str, password: str):
        self.type_text(*self.USERNAME_FIELD, username)
        self.type_text(*self.PASSWORD_FIELD, password)
        self.click(*self.LOGIN_BUTTON)

    def get_error(self) -> str:
        return self.get_text(*self.ERROR_MESSAGE)

    def is_login_visible(self) -> bool:
        return self.is_visible(*self.LOGIN_BUTTON)
```

---

## Test example

### `tests/android/test_login_android.py`

```python
import pytest
from pages.login_page import LoginPage
from pages.home_page import HomePage

class TestLoginAndroid:

    def test_valid_login(self, android_driver):
        login = LoginPage(android_driver)
        home  = HomePage(android_driver)

        assert login.is_login_visible(), "Login screen not displayed"
        login.login("user@example.com", "ValidPass123")
        assert home.is_home_visible(), "Home screen not displayed after login"

    def test_invalid_login(self, android_driver):
        login = LoginPage(android_driver)

        login.login("wrong@example.com", "badpass")
        error = login.get_error()
        assert "Invalid" in error, f"Expected error message, got: {error}"

    @pytest.mark.parametrize("user,pwd", [
        ("", "pass123"),
        ("user@test.com", ""),
        ("", ""),
    ])
    def test_empty_fields(self, android_driver, user, pwd):
        login = LoginPage(android_driver)
        login.login(user, pwd)
        assert login.is_login_visible(), "Should remain on login screen"
```

---

## pytest.ini

```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts =
    -v
    --html=reports/report.html
    --self-contained-html
markers =
    android: marks tests as android-only
    ios: marks tests as ios-only
    smoke: smoke test suite
    regression: full regression suite
```

---

## CI/CD Integration

For detailed CI/CD pipeline code, read the reference files:

- **GitHub Actions** → `references/ci_github_actions.md`
- **Jenkins** → `references/ci_jenkins.md`

---

## Common troubleshooting

| Error | Likely cause | Fix |
|---|---|---|
| `Could not find a connected Android device` | ADB not seeing device | `adb devices`, enable USB debugging |
| `An unknown server-side error occurred` | Driver not installed | `appium driver install uiautomator2` |
| `Session not created: No matching capabilities` | Wrong caps key | Use `appium:` prefix for non-W3C caps |
| `Element not found` / timeout | Locator wrong or timing | Use Appium Inspector to re-check locator |
| `WebDriverException: Message: unknown error` | App crashed | Check device logs: `adb logcat` |
| iOS `xcodebuild` fails | Provisioning/Xcode mismatch | Check Xcode version + `appium driver update xcuitest` |

---

## Locator strategy priority (best practice)

1. `ACCESSIBILITY_ID` — most stable, cross-platform
2. `ID` (resource-id on Android, accessibility id on iOS)
3. `XPATH` — last resort, fragile
4. `-android uiautomator` / `-ios predicate string` — platform-specific power locators

---

## Key imports cheatsheet

```python
from appium import webdriver
from appium.options import AppiumOptions
from appium.webdriver.common.appiumby import AppiumBy
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
```