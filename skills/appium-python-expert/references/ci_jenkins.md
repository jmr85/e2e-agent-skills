# Jenkins — Appium + Python CI Pipeline

## Prerequisites on Jenkins agent

```bash
# Node.js + Appium
node --version   # >= 18
npm install -g appium@latest
appium driver install uiautomator2
appium driver install xcuitest

# Python
python3 --version   # >= 3.10
pip install -r requirements.txt

# Android SDK (set ANDROID_HOME)
export ANDROID_HOME=/opt/android-sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

---

## Declarative Jenkinsfile — Android

```groovy
// Jenkinsfile.android
pipeline {
    agent { label 'android-agent' }

    environment {
        APPIUM_HOST    = '127.0.0.1'
        APPIUM_PORT    = '4723'
        ANDROID_APP_PATH = "${WORKSPACE}/apps/app-debug.apk"
        ANDROID_DEVICE_NAME = 'emulator-5554'
        REPORTS_DIR    = "${WORKSPACE}/reports"
    }

    options {
        timeout(time: 60, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install dependencies') {
            steps {
                sh '''
                    python3 -m venv venv
                    . venv/bin/activate
                    pip install --upgrade pip
                    pip install -r requirements.txt
                '''
            }
        }

        stage('Start Appium') {
            steps {
                sh '''
                    pkill -f "appium" || true
                    nohup appium \
                        --address ${APPIUM_HOST} \
                        --port ${APPIUM_PORT} \
                        --log appium.log &
                    sleep 5
                    curl -s http://${APPIUM_HOST}:${APPIUM_PORT}/status
                '''
            }
        }

        stage('Start Android Emulator') {
            steps {
                sh '''
                    # Assumes AVD already created: avdmanager create avd -n TestAVD -k "system-images;android-33;google_apis;x86_64"
                    emulator -avd TestAVD -no-audio -no-window -no-snapshot &
                    adb wait-for-device
                    # Wait for full boot
                    timeout 120 bash -c \
                      'until [[ $(adb shell getprop sys.boot_completed 2>/dev/null) == "1" ]]; do sleep 3; done'
                '''
            }
        }

        stage('Run Android E2E Tests') {
            steps {
                sh '''
                    . venv/bin/activate
                    mkdir -p ${REPORTS_DIR}
                    pytest tests/android/ \
                        -v \
                        --html=${REPORTS_DIR}/android-report.html \
                        --self-contained-html \
                        -m "android" \
                        --junitxml=${REPORTS_DIR}/android-junit.xml \
                        --alluredir=allure-results
                '''
            }
        }

        stage('Generate Allure Report') {
            steps {
                sh 'allure generate allure-results --clean -o allure-report'
            }
        }
    }

    post {
        always {
            // Allure Report (requiere plugin Allure Jenkins)
            allure([
                includeProperties: false,
                jdk: '',
                results: [[path: 'allure-results']]
            ])

            // Publish HTML report
            publishHTML(target: [
                allowMissing: false,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'reports',
                reportFiles: 'android-report.html',
                reportName: 'Android E2E Report'
            ])

            // JUnit results
            junit allowEmptyResults: true,
                  testResults: 'reports/android-junit.xml'

            // Archive logs
            archiveArtifacts artifacts: 'appium.log', allowEmptyArchive: true

            // Kill Appium + emulator
            sh '''
                pkill -f "appium" || true
                pkill -f "emulator" || true
            '''
        }

        failure {
            emailext(
                subject: "FAILED: Android E2E — Build #${env.BUILD_NUMBER}",
                body: """
                    Build ${env.BUILD_NUMBER} failed.
                    URL: ${env.BUILD_URL}
                    Check the attached report and Appium logs.
                """,
                recipientProviders: [[$class: 'DevelopersRecipientProvider']]
            )
        }
    }
}
```

---

## Declarative Jenkinsfile — iOS (macOS agent)

```groovy
// Jenkinsfile.ios
pipeline {
    agent { label 'macos-agent' }

    environment {
        APPIUM_HOST         = '127.0.0.1'
        APPIUM_PORT         = '4724'   // different port to avoid conflict
        IOS_DEVICE_NAME     = 'iPhone 15'
        IOS_PLATFORM_VERSION = '17.0'
        IOS_APP_PATH        = "${WORKSPACE}/apps/app.app"
        REPORTS_DIR         = "${WORKSPACE}/reports"
    }

    options {
        timeout(time: 60, unit: 'MINUTES')
    }

    stages {
        stage('Checkout') {
            steps { checkout scm }
        }

        stage('Install dependencies') {
            steps {
                sh '''
                    python3 -m venv venv
                    . venv/bin/activate
                    pip install -r requirements.txt
                '''
            }
        }

        stage('Start Appium') {
            steps {
                sh '''
                    pkill -f "appium" || true
                    nohup appium \
                        --address ${APPIUM_HOST} \
                        --port ${APPIUM_PORT} \
                        --log appium-ios.log &
                    sleep 8
                '''
            }
        }

        stage('Boot iOS Simulator') {
            steps {
                sh '''
                    # Shutdown stale simulators
                    xcrun simctl shutdown all || true
                    UDID=$(xcrun simctl list devices | grep "iPhone 15 (" | grep -v unavailable | head -1 | awk -F'[()]' '{print $2}')
                    xcrun simctl boot $UDID
                    xcrun simctl install $UDID ${IOS_APP_PATH}
                    echo "Booted simulator: $UDID"
                '''
            }
        }

        stage('Run iOS E2E Tests') {
            steps {
                sh '''
                    . venv/bin/activate
                    mkdir -p ${REPORTS_DIR}
                    pytest tests/ios/ \
                        -v \
                        --html=${REPORTS_DIR}/ios-report.html \
                        --self-contained-html \
                        -m "ios" \
                        --junitxml=${REPORTS_DIR}/ios-junit.xml
                '''
            }
        }
    }

    post {
        always {
            publishHTML(target: [
                reportDir: 'reports',
                reportFiles: 'ios-report.html',
                reportName: 'iOS E2E Report',
                keepAll: true,
                alwaysLinkToLastBuild: true
            ])
            junit allowEmptyResults: true, testResults: 'reports/ios-junit.xml'
            archiveArtifacts artifacts: 'appium-ios.log', allowEmptyArchive: true
            sh '''
                pkill -f "appium" || true
                xcrun simctl shutdown all || true
            '''
        }
    }
}
```

---

## Multi-platform Jenkinsfile (parallel stages)

```groovy
// Jenkinsfile.parallel
pipeline {
    agent none

    stages {
        stage('Mobile E2E') {
            parallel {
                stage('Android') {
                    agent { label 'android-agent' }
                    steps {
                        checkout scm
                        sh '''
                            python3 -m venv venv && . venv/bin/activate
                            pip install -r requirements.txt
                            appium --port 4723 --log appium-android.log &
                            sleep 5
                            pytest tests/android/ -v \
                                --html=reports/android-report.html \
                                --junitxml=reports/android.xml
                        '''
                    }
                    post {
                        always {
                            junit 'reports/android.xml'
                            archiveArtifacts 'reports/android-report.html, appium-android.log'
                        }
                    }
                }

                stage('iOS') {
                    agent { label 'macos-agent' }
                    steps {
                        checkout scm
                        sh '''
                            python3 -m venv venv && . venv/bin/activate
                            pip install -r requirements.txt
                            appium --port 4724 --log appium-ios.log &
                            sleep 8
                            pytest tests/ios/ -v \
                                --html=reports/ios-report.html \
                                --junitxml=reports/ios.xml
                        '''
                    }
                    post {
                        always {
                            junit 'reports/ios.xml'
                            archiveArtifacts 'reports/ios-report.html, appium-ios.log'
                        }
                    }
                }
            }
        }
    }
}
```

---

## Useful Jenkins plugins

| Plugin | Purpose |
|---|---|
| `HTML Publisher` | Render pytest-html reports |
| `JUnit` | Parse JUnit XML results |
| `Allure` | Publicar reportes Allure interactivos |
| `Email Extension` | Failure notifications |
| `Android Emulator` | Manage AVDs from Jenkins |
| `Pipeline` | Declarative pipelines |
| `Blue Ocean` | Visual pipeline UI |