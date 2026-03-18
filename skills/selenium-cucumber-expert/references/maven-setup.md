# Maven / Gradle Setup for Selenium + Cucumber Java

## Recommended dependency stack

Use these versions as a baseline — always check for newer stable releases:

| Dependency | GroupId | ArtifactId | Recommended version |
|---|---|---|---|
| Selenium Java | `org.seleniumhq.selenium` | `selenium-java` | `4.x.x` (latest stable) |
| WebDriverManager | `io.github.bonigarcia` | `webdrivermanager` | `5.x.x` |
| Cucumber Java | `io.cucumber` | `cucumber-java` | `7.x.x` |
| Cucumber JUnit Platform | `io.cucumber` | `cucumber-junit-platform-engine` | `7.x.x` |
| JUnit Platform | `org.junit.platform` | `junit-platform-suite` | `1.x.x` |
| PicoContainer (DI) | `io.cucumber` | `cucumber-picocontainer` | `7.x.x` |
| TestNG (alternative) | `org.testng` | `testng` | `7.x.x` |
| ExtentReports | `com.aventstack` | `extentreports` | `5.x.x` |
| SLF4J + Logback | `org.slf4j` | `slf4j-api` / `logback-classic` | latest stable |

## Minimal `pom.xml` snippet

```xml
<properties>
    <maven.compiler.source>17</maven.compiler.source>
    <maven.compiler.target>17</maven.compiler.target>
    <selenium.version>4.20.0</selenium.version>
    <cucumber.version>7.18.0</cucumber.version>
    <webdrivermanager.version>5.8.0</webdrivermanager.version>
</properties>

<dependencies>
    <!-- Selenium -->
    <dependency>
        <groupId>org.seleniumhq.selenium</groupId>
        <artifactId>selenium-java</artifactId>
        <version>${selenium.version}</version>
    </dependency>

    <!-- WebDriverManager - auto-downloads browser drivers -->
    <dependency>
        <groupId>io.github.bonigarcia</groupId>
        <artifactId>webdrivermanager</artifactId>
        <version>${webdrivermanager.version}</version>
    </dependency>

    <!-- Cucumber core -->
    <dependency>
        <groupId>io.cucumber</groupId>
        <artifactId>cucumber-java</artifactId>
        <version>${cucumber.version}</version>
    </dependency>

    <!-- DI for sharing state between step classes -->
    <dependency>
        <groupId>io.cucumber</groupId>
        <artifactId>cucumber-picocontainer</artifactId>
        <version>${cucumber.version}</version>
    </dependency>

    <!-- JUnit Platform runner (modern, preferred over JUnit 4) -->
    <dependency>
        <groupId>io.cucumber</groupId>
        <artifactId>cucumber-junit-platform-engine</artifactId>
        <version>${cucumber.version}</version>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>org.junit.platform</groupId>
        <artifactId>junit-platform-suite</artifactId>
        <scope>test</scope>
    </dependency>

    <!-- Reporting -->
    <dependency>
        <groupId>com.aventstack</groupId>
        <artifactId>extentreports</artifactId>
        <version>5.1.1</version>
    </dependency>

    <!-- Logging -->
    <dependency>
        <groupId>ch.qos.logback</groupId>
        <artifactId>logback-classic</artifactId>
        <version>1.4.14</version>
    </dependency>
</dependencies>
```

## Maven Surefire / Failsafe plugin

Use **Failsafe** (not Surefire) for integration/E2E tests — it distinguishes test failures from build errors and guarantees teardown:

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-failsafe-plugin</artifactId>
            <version>3.2.5</version>
            <configuration>
                <includes>
                    <include>**/*Runner.java</include>
                </includes>
                <!-- For parallel execution, see references/parallel-execution.md -->
            </configuration>
            <executions>
                <execution>
                    <goals>
                        <goal>integration-test</goal>
                        <goal>verify</goal>
                    </goals>
                </execution>
            </executions>
        </plugin>
    </plugins>
</build>
```

Run tests with:
```bash
mvn clean verify
# or with tags:
mvn clean verify -Dcucumber.filter.tags="@smoke"
```

## Gradle alternative

```groovy
dependencies {
    testImplementation "org.seleniumhq.selenium:selenium-java:4.20.0"
    testImplementation "io.github.bonigarcia:webdrivermanager:5.8.0"
    testImplementation "io.cucumber:cucumber-java:7.18.0"
    testImplementation "io.cucumber:cucumber-picocontainer:7.18.0"
    testImplementation "io.cucumber:cucumber-junit-platform-engine:7.18.0"
    testImplementation "org.junit.platform:junit-platform-suite:1.10.2"
    testImplementation "com.aventstack:extentreports:5.1.1"
}
```

## WebDriverManager — no more manual driver downloads

WebDriverManager automatically downloads and configures the correct browser driver. Use it in your `DriverManager` class:

```java
import io.github.bonigarcia.wdm.WebDriverManager;

// In setup (Before hook or DriverManager class):
WebDriverManager.chromedriver().setup();
WebDriver driver = new ChromeDriver();

// For other browsers:
WebDriverManager.firefoxdriver().setup();
WebDriverManager.edgedriver().setup();
```

> **Why WebDriverManager?** Manual driver management means the driver binary goes out of sync with the browser every update. WebDriverManager resolves the correct version automatically, making your CI pipeline resilient to browser updates.

## `cucumber.properties` (optional but useful)

Place in `src/test/resources/`:

```properties
cucumber.publish.quiet=true
cucumber.execution.parallel.enabled=false
# Enable for parallel: cucumber.execution.parallel.enabled=true
```

## Common version conflict fixes

- **Selenium 4 + old Guava**: Selenium 4 bundles its own Guava — exclude external Guava if you get `NoSuchMethodError`
- **Cucumber 7 + JUnit 4**: Don't mix `cucumber-junit` (JUnit 4) with `cucumber-junit-platform-engine` (JUnit 5) — pick one
- **WebDriverManager 5 + Java 8**: WDM 5 requires Java 11+; use WDM 4.x for Java 8 projects
