/**
 * Ralph Loop E2E Test Runner
 * 
 * Implements iterative detection and repair methodology:
 * 1. Run tests
 * 2. Detect failures
 * 3. Diagnose root cause
 * 4. Attempt repair
 * 5. Re-run failed tests
 * 
 * Usage: npx tsx e2e/ralph-loop.ts
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
}

interface RalphLoopConfig {
  maxIterations: number;
  testCommand: string;
  reportPath: string;
}

const config: RalphLoopConfig = {
  maxIterations: 3,
  testCommand: 'npx playwright test booking.spec.ts --reporter=json',
  reportPath: 'test-results/results.json',
};

async function runTests(): Promise<{ success: boolean; results: TestResult[] }> {
  console.log('\n🔄 Running E2E tests...\n');
  
  try {
    execSync(config.testCommand, { 
      stdio: 'inherit',
      env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: config.reportPath }
    });
    return { success: true, results: [] };
  } catch (error) {
    // Tests failed, parse results
    return { success: false, results: parseResults() };
  }
}

function parseResults(): TestResult[] {
  if (!existsSync(config.reportPath)) {
    console.log('⚠️  No test results file found');
    return [];
  }

  try {
    const report = JSON.parse(readFileSync(config.reportPath, 'utf-8'));
    const results: TestResult[] = [];

    for (const suite of report.suites || []) {
      for (const spec of suite.specs || []) {
        for (const test of spec.tests || []) {
          results.push({
            name: spec.title,
            status: test.status,
            duration: test.results?.[0]?.duration || 0,
            error: test.results?.[0]?.error?.message,
          });
        }
      }
    }

    return results;
  } catch (e) {
    console.log('⚠️  Could not parse test results');
    return [];
  }
}

function diagnoseFailures(results: TestResult[]): string[] {
  const diagnoses: string[] = [];
  const failures = results.filter(r => r.status === 'failed');

  for (const failure of failures) {
    const error = failure.error || 'Unknown error';
    
    // Common failure patterns and diagnoses
    if (error.includes('timeout') || error.includes('Timeout')) {
      diagnoses.push(`[${failure.name}] TIMEOUT - Page or element took too long to load`);
    } else if (error.includes('not visible') || error.includes('not found')) {
      diagnoses.push(`[${failure.name}] ELEMENT NOT FOUND - Selector may be incorrect or element not rendered`);
    } else if (error.includes('modal') || error.includes('Modal')) {
      diagnoses.push(`[${failure.name}] MODAL ISSUE - Modal may not be opening/closing properly`);
    } else if (error.includes('API') || error.includes('fetch') || error.includes('500')) {
      diagnoses.push(`[${failure.name}] API ERROR - Backend may be down or returning errors`);
    } else if (error.includes('validation') || error.includes('invalid')) {
      diagnoses.push(`[${failure.name}] VALIDATION ERROR - Form data may be invalid`);
    } else {
      diagnoses.push(`[${failure.name}] UNKNOWN - ${error.slice(0, 100)}`);
    }
  }

  return diagnoses;
}

function suggestRepairs(diagnoses: string[]): string[] {
  const repairs: string[] = [];

  for (const diagnosis of diagnoses) {
    if (diagnosis.includes('TIMEOUT')) {
      repairs.push('- Increase timeout values in test');
      repairs.push('- Check if dev server is running');
      repairs.push('- Verify network connectivity');
    } else if (diagnosis.includes('ELEMENT NOT FOUND')) {
      repairs.push('- Update selectors to match current DOM');
      repairs.push('- Add waitFor before interacting with elements');
      repairs.push('- Check if component is conditionally rendered');
    } else if (diagnosis.includes('MODAL')) {
      repairs.push('- Verify modal trigger is working');
      repairs.push('- Check modal close logic');
      repairs.push('- Add explicit waits for modal animations');
    } else if (diagnosis.includes('API ERROR')) {
      repairs.push('- Check if dev server is running');
      repairs.push('- Verify API endpoint exists');
      repairs.push('- Check database connection');
    } else if (diagnosis.includes('VALIDATION')) {
      repairs.push('- Verify test data meets validation requirements');
      repairs.push('- Check form field selectors');
    }
  }

  return [...new Set(repairs)]; // Dedupe
}

async function main() {
  console.log('🚀 Ralph Loop E2E Test Runner');
  console.log('============================\n');
  console.log(`Max iterations: ${config.maxIterations}`);

  let iteration = 0;
  let allPassed = false;

  while (iteration < config.maxIterations && !allPassed) {
    iteration++;
    console.log(`\n📍 Iteration ${iteration}/${config.maxIterations}`);
    console.log('─'.repeat(40));

    const { success, results } = await runTests();

    if (success) {
      allPassed = true;
      console.log('\n✅ All tests passed!');
      break;
    }

    // Diagnose failures
    const diagnoses = diagnoseFailures(results);
    
    console.log('\n🔍 Diagnosis:');
    diagnoses.forEach(d => console.log(`  ${d}`));

    // Suggest repairs
    const repairs = suggestRepairs(diagnoses);
    
    console.log('\n🔧 Suggested repairs:');
    repairs.forEach(r => console.log(`  ${r}`));

    if (iteration < config.maxIterations) {
      console.log('\n⏳ Waiting 2 seconds before retry...');
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // Final summary
  console.log('\n' + '='.repeat(40));
  console.log('📊 RALPH LOOP SUMMARY');
  console.log('='.repeat(40));
  console.log(`Total iterations: ${iteration}`);
  console.log(`Final status: ${allPassed ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (!allPassed) {
    console.log('\n⚠️  Tests still failing after max iterations.');
    console.log('Manual intervention required.');
    process.exit(1);
  }

  process.exit(0);
}

main().catch(console.error);
