// Learn more about configuring this file at <https://theintern.github.io/intern/#configuration>.
// These default settings work OK for most people. The options that *must* be changed below are the
// packages, suites, excludeInstrumentation, and (if you want functional tests) functionalSuites
define({
	// Default desired capabilities for all environments. Individual capabilities can be overridden by any of the
	// specified browser environments in the `environments` array below as well. See
	// <https://theintern.github.io/intern/#option-capabilities> for links to the different capabilities options for
	// different services.
	capabilities: [{ browserName: 'chrome' }],

	// Browsers to run integration testing against. Note that version numbers must be strings if used with Sauce
	// OnDemand. Options that will be permutated are browserName, version, platform, and platformVersion; any other
	// capabilities options specified for an environment will be copied as-is
	environments: [{ browserName: 'chrome' }],

	// Maximum number of simultaneous integration tests that should be executed on the remote WebDriver service
	// maxConcurrency: 2,

	// Name of the tunnel class to use for WebDriver tests.
	// See <https://theintern.github.io/intern/#option-tunnel> for built-in options
	tunnel: 'NullTunnel',

	// Non-functional test suite(s) to run in each browser
	suites: [ /* 'tests/unit/unit-test' */ ],

	// Functional test suite(s) to execute against each browser once non-functional tests are completed
	functionalSuites: [
		'tests/functional/welcome-modal',
		'tests/functional/upsell-modal',
		'tests/functional/roadblock-modal',
		'tests/functional/no-modals',
		'tests/functional/login'
	],

	// A regular expression matching URLs to files that should not be included in code coverage analysis
	excludeInstrumentation: /^(?:tests|node_modules)\//
});
