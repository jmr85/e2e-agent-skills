package com.mycompany.tests.runners;

import org.junit.platform.suite.api.ConfigurationParameter;
import org.junit.platform.suite.api.IncludeEngines;
import org.junit.platform.suite.api.SelectClasspathResource;
import org.junit.platform.suite.api.Suite;

import static io.cucumber.junit.platform.engine.Constants.*;

/**
 * Main Cucumber test runner using JUnit Platform.
 *
 * Run all tests:    mvn clean verify
 * Run smoke only:   mvn clean verify -Dcucumber.filter.tags="@smoke"
 * Run headless:     mvn clean verify -Dheadless=true
 * Run on Grid:      mvn clean verify -Duse.grid=true -Dgrid.url=http://localhost:4444
 */
@Suite
@IncludeEngines("cucumber")
@SelectClasspathResource("features")
@ConfigurationParameter(key = GLUE_PROPERTY_NAME,   value = "com.mycompany.tests")
@ConfigurationParameter(key = PLUGIN_PROPERTY_NAME, value =
    "pretty," +
    "html:target/cucumber-reports/cucumber.html," +
    "json:target/cucumber-reports/cucumber.json," +
    "junit:target/cucumber-reports/cucumber.xml"
)
@ConfigurationParameter(key = FILTER_TAGS_PROPERTY_NAME, value = "not @wip")
@ConfigurationParameter(key = PUBLISH_QUIET_PROPERTY_NAME, value = "true")
public class TestRunner {
    // This class is intentionally empty.
    // The @Suite annotations above configure Cucumber's JUnit Platform engine.
}
