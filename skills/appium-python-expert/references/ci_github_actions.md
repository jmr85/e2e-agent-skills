# GitHub Actions — Appium + Python CI Pipeline

## Android pipeline (emulator)

```yaml
# .github/workflows/android-tests.yml
name: Android E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  android-e2e:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Java (required for Android SDK)
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install Python dependencies
        run: pip install -r requirements.txt

      - name: Set up Node.js (for Appium)
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Appium 2.x and UIAutomator2 driver
        run: |
          npm install -g appium@latest
          appium driver install uiautomator2

      - name: Enable KVM for emulator acceleration
        run: |
          echo 'KERNEL=="kvm", GROUP="kvm", MODE="0666", OPTIONS+="static_node=kvm"' \
            | sudo tee /etc/udev/rules.d/99-kvm4all.rules
          sudo udevadm control --reload-rules
          sudo udevadm trigger --name-match=kvm

      - name: Start Android emulator
        uses: reactivecircus/android-emulator-runner@v2
        with:
          api-level: 33
          target: google_apis
          arch: x86_64
          profile: pixel_6
          emulator-options: -no-snapshot -no-audio -no-boot-anim -gpu swiftshader_indirect
          script: |
            adb wait-for-device
            adb shell input keyevent 82

      - name: Start Appium server
        run: |
          appium --log appium.log &
          sleep 5
          curl http://127.0.0.1:4723/status

      - name: Run Android tests
        env:
          ANDROID_APP_PATH: ${{ github.workspace }}/apps/app-debug.apk
          ANDROID_DEVICE_NAME: emulator-5554
          APPIUM_HOST: 127.0.0.1
          APPIUM_PORT: 4723
        run: |
          pytest tests/android/ -v \
            --html=reports/android-report.html \
            --self-contained-html \
            -m "android"

      - name: Generate Allure report
        if: always()
        run: |
          npm install -g allure-commandline
          allure generate allure-results --clean -o allure-report

      - name: Upload Allure report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: allure-android-report
          path: allure-report/

      - name: Upload pytest HTML report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: android-html-report
          path: reports/

      - name: Upload Appium logs on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: appium-logs
          path: appium.log
```

## iOS pipeline (macOS runner)

```yaml
# .github/workflows/ios-tests.yml
name: iOS E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  ios-e2e:
    runs-on: macos-14   # Apple Silicon — required for iOS simulator

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install Python dependencies
        run: pip install -r requirements.txt

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Appium 2.x and XCUITest driver
        run: |
          npm install -g appium@latest
          appium driver install xcuitest

      - name: Start iOS Simulator
        run: |
          UDID=$(xcrun simctl create "TestDevice" \
            "com.apple.CoreSimulator.SimDeviceType.iPhone-15" \
            "com.apple.CoreSimulator.SimRuntime.iOS-17-0")
          xcrun simctl boot $UDID
          echo "SIM_UDID=$UDID" >> $GITHUB_ENV
          xcrun simctl install $UDID apps/app.app

      - name: Start Appium server
        run: |
          appium --log appium.log &
          sleep 8

      - name: Run iOS tests
        env:
          IOS_DEVICE_NAME: iPhone 15
          IOS_PLATFORM_VERSION: "17.0"
          IOS_APP_PATH: ${{ github.workspace }}/apps/app.app
          APPIUM_HOST: 127.0.0.1
          APPIUM_PORT: 4723
        run: |
          pytest tests/ios/ -v \
            --html=reports/ios-report.html \
            --self-contained-html \
            -m "ios"

      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: ios-test-report
          path: reports/
```

## Combined matrix pipeline (advanced)

```yaml
# .github/workflows/e2e-matrix.yml
name: Mobile E2E Matrix

on:
  schedule:
    - cron: '0 2 * * *'   # nightly at 2am
  workflow_dispatch:
    inputs:
      platform:
        description: 'Platform to test'
        required: true
        default: 'android'
        type: choice
        options: [android, ios, all]

jobs:
  e2e-tests:
    strategy:
      fail-fast: false
      matrix:
        include:
          - platform: android
            os: ubuntu-latest
            marker: android
          - platform: ios
            os: macos-14
            marker: ios

    runs-on: ${{ matrix.os }}
    name: E2E ${{ matrix.platform }}

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r requirements.txt
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: |
          npm install -g appium@latest
          appium driver install uiautomator2 || true
          appium driver install xcuitest || true

      # ... platform-specific setup steps ...

      - name: Run tests
        run: |
          pytest tests/${{ matrix.platform }}/ \
            -v --html=reports/${{ matrix.platform }}-report.html \
            --self-contained-html

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: report-${{ matrix.platform }}
          path: reports/
```