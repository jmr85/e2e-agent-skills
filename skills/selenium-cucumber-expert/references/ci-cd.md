# CI/CD — GitHub Actions + Docker / Selenium Grid

Automation tests that only run locally provide limited value. Integrating with CI/CD ensures every code change is verified automatically, and Selenium Grid / Docker enables distributed, scalable execution.

---

## GitHub Actions — basic CI workflow

Save as `.github/workflows/ci.yml`:

```yaml
name: Selenium BDD Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    name: Run Cucumber Tests
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: maven

      - name: Install Chrome
        uses: browser-actions/setup-chrome@v1

      - name: Run tests
        run: mvn clean verify -Dheadless=true -Dbrowser=chrome
        env:
          BASE_URL: ${{ secrets.STAGING_BASE_URL }}
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}

      - name: Upload test reports
        uses: actions/upload-artifact@v4
        if: always()   # upload even when tests fail
        with:
          name: test-reports-${{ github.run_number }}
          path: |
            target/cucumber-reports/
            target/extent-reports/
          retention-days: 7

      - name: Publish JUnit results
        uses: dorny/test-reporter@v1
        if: always()
        with:
          name: Cucumber Test Results
          path: target/cucumber-reports/cucumber.xml
          reporter: java-junit
```

---

## Smoke-only workflow (fast feedback on PR)

```yaml
name: Smoke Tests (PR)

on:
  pull_request:
    branches: [main, develop]

jobs:
  smoke:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: maven
      - name: Run smoke tests
        run: mvn clean verify -Dheadless=true -Dcucumber.filter.tags="@smoke"
```

---

## Nightly regression workflow

```yaml
name: Nightly Regression

on:
  schedule:
    - cron: '0 2 * * *'   # runs at 2:00 AM UTC every day

jobs:
  regression:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chrome, firefox]   # run on multiple browsers
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { java-version: '17', distribution: 'temurin', cache: maven }
      - name: Run regression
        run: |
          mvn clean verify \
            -Dheadless=true \
            -Dbrowser=${{ matrix.browser }} \
            -Dcucumber.filter.tags="@regression"
      - name: Upload reports
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: regression-${{ matrix.browser }}-${{ github.run_number }}
          path: target/
```

---

## Docker + Selenium Grid 4

Selenium Grid lets you run tests on remote browsers — useful for cross-browser testing, scaling, and keeping your CI machine clean.

### `docker/docker-compose.yml`

```yaml
version: '3.8'

services:
  selenium-hub:
    image: selenium/hub:4.20.0
    container_name: selenium-hub
    ports:
      - "4442:4442"
      - "4443:4443"
      - "4444:4444"

  chrome-node:
    image: selenium/node-chrome:4.20.0
    shm_size: 2gb
    depends_on:
      - selenium-hub
    environment:
      - SE_EVENT_BUS_HOST=selenium-hub
      - SE_EVENT_BUS_PUBLISH_PORT=4442
      - SE_EVENT_BUS_SUBSCRIBE_PORT=4443
      - SE_NODE_MAX_SESSIONS=4
      - SE_NODE_OVERRIDE_MAX_SESSIONS=true

  firefox-node:
    image: selenium/node-firefox:4.20.0
    shm_size: 2gb
    depends_on:
      - selenium-hub
    environment:
      - SE_EVENT_BUS_HOST=selenium-hub
      - SE_EVENT_BUS_PUBLISH_PORT=4442
      - SE_EVENT_BUS_SUBSCRIBE_PORT=4443

  # Optional: VNC for visual debugging
  chrome-node-debug:
    image: selenium/node-chrome:4.20.0
    shm_size: 2gb
    depends_on:
      - selenium-hub
    ports:
      - "7900:7900"   # noVNC web interface
    environment:
      - SE_EVENT_BUS_HOST=selenium-hub
      - SE_EVENT_BUS_PUBLISH_PORT=4442
      - SE_EVENT_BUS_SUBSCRIBE_PORT=4443
```

### Connect to Grid from DriverManager

```java
public static WebDriver createRemoteDriver(String browser) throws MalformedURLException {
    String gridUrl = ConfigReader.get("grid.url", "http://localhost:4444");

    DesiredCapabilities caps = new DesiredCapabilities();
    switch (browser.toLowerCase()) {
        case "firefox":
            caps.setBrowserName("firefox");
            break;
        case "chrome":
        default:
            ChromeOptions options = new ChromeOptions();
            options.addArguments("--no-sandbox", "--disable-dev-shm-usage");
            caps.merge(options);
            break;
    }

    return new RemoteWebDriver(new URL(gridUrl + "/wd/hub"), caps);
}
```

Override in `config.properties`:
```properties
grid.url=http://localhost:4444
use.grid=false
```

Update `DriverManager.createDriver()`:
```java
if (Boolean.parseBoolean(ConfigReader.get("use.grid", "false"))) {
    return createRemoteDriver(browser);
} else {
    // local driver creation...
}
```

### Running with Grid locally

```bash
# Start Grid
docker compose -f docker/docker-compose.yml up -d

# Run tests against Grid
mvn clean verify -Duse.grid=true -Dgrid.url=http://localhost:4444

# View Grid status
open http://localhost:4444/ui

# View VNC (Chrome debug node)
open http://localhost:7900/?autoconnect=1&resize=scale&password=secret

# Stop Grid
docker compose -f docker/docker-compose.yml down
```

---

## GitHub Actions + Grid (run Grid in CI)

```yaml
jobs:
  grid-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Start Selenium Grid
        run: docker compose -f docker/docker-compose.yml up -d

      - name: Wait for Grid to be ready
        run: |
          timeout 60 bash -c \
            'until curl -sf http://localhost:4444/wd/hub/status | grep -q "\"ready\": true"; do sleep 2; done'

      - uses: actions/setup-java@v4
        with: { java-version: '17', distribution: 'temurin', cache: maven }

      - name: Run tests on Grid
        run: |
          mvn clean verify \
            -Duse.grid=true \
            -Dgrid.url=http://localhost:4444 \
            -Dcucumber.execution.parallel.enabled=true \
            -Dcucumber.execution.parallel.config.fixed.parallelism=4

      - name: Stop Grid
        if: always()
        run: docker compose -f docker/docker-compose.yml down

      - name: Upload reports
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: grid-test-reports
          path: target/
```

---

## Environment variable strategy

Never hardcode credentials or URLs. Use this hierarchy (highest precedence first):

1. **GitHub Actions secrets** → set as environment variables → read by Maven as `-D` properties
2. **System properties** (`-Dbase.url=...`) → override `config.properties`
3. **`config.properties`** → base defaults for local development

`ConfigReader.get()` already implements this: `System.getProperty(key, props.getProperty(key))`.
