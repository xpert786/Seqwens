/**
 * Smoke Test Suite for Seqwens Application
 * Tests all roles: super_admin, admin (firm admin), and client
 * 
 * Run this in browser console after logging in with each role
 * Usage: Copy and paste into browser console, or run via automated testing tool
 */

class SmokeTestSuite {
  constructor() {
    this.results = {
      super_admin: { passed: [], failed: [], warnings: [] },
      admin: { passed: [], failed: [], warnings: [] },
      client: { passed: [], failed: [], warnings: [] }
    };
    this.currentRole = null;
  }

  // Helper to check if element exists
  elementExists(selector) {
    return document.querySelector(selector) !== null;
  }

  // Helper to check if link is valid
  async checkLink(linkElement) {
    try {
      const href = linkElement.getAttribute('href');
      if (!href || href === '#' || href.startsWith('javascript:')) {
        return { valid: false, reason: 'Invalid or empty href' };
      }
      // Check if it's a route link (React Router)
      if (href.startsWith('/')) {
        return { valid: true, type: 'route' };
      }
      // External link - can't fully test without navigation
      return { valid: true, type: 'external' };
    } catch (e) {
      return { valid: false, reason: e.message };
    }
  }

  // Test form validation
  testFormValidation(formSelector, requiredFields) {
    const form = document.querySelector(formSelector);
    if (!form) {
      return { passed: false, message: `Form not found: ${formSelector}` };
    }

    const errors = [];
    requiredFields.forEach(field => {
      const input = form.querySelector(`[name="${field}"]`) || 
                   form.querySelector(`#${field}`) ||
                   form.querySelector(`input[placeholder*="${field}"]`);
      
      if (!input) {
        errors.push(`Required field not found: ${field}`);
      } else {
        // Check if field has required attribute or validation
        if (!input.hasAttribute('required') && !input.getAttribute('aria-required')) {
          errors.push(`Field ${field} missing required attribute`);
        }
      }
    });

    return {
      passed: errors.length === 0,
      message: errors.length === 0 ? 'All required fields found' : errors.join('; ')
    };
  }

  // Test Super Admin features
  async testSuperAdmin() {
    this.currentRole = 'super_admin';
    console.log('🧪 Testing Super Admin Role...');

    // Test navigation links
    const superAdminLinks = [
      '/superadmin',
      '/superadmin/dashboard',
      '/superadmin/users',
      '/superadmin/firms',
      '/superadmin/subscriptions',
      '/superadmin/analytics',
      '/superadmin/settings',
      '/superadmin/support'
    ];

    superAdminLinks.forEach(link => {
      const linkElement = document.querySelector(`a[href="${link}"]`);
      if (linkElement) {
        this.results.super_admin.passed.push(`Link exists: ${link}`);
      } else {
        this.results.super_admin.warnings.push(`Link not found in DOM: ${link} (may be rendered dynamically)`);
      }
    });

    // Test Firm Management
    if (window.location.pathname.includes('/superadmin/firms')) {
      // Check for Add Firm button
      const addFirmBtn = document.querySelector('button:contains("Add Firm"), button[onclick*="AddFirm"]');
      if (addFirmBtn || document.querySelector('button').textContent.includes('Add Firm')) {
        this.results.super_admin.passed.push('Firm Management: Add Firm button exists');
      } else {
        this.results.super_admin.failed.push('Firm Management: Add Firm button not found');
      }

      // Test firm creation form
      const formTest = this.testFormValidation('form', ['firmName', 'ownerName', 'email', 'plan']);
      if (formTest.passed) {
        this.results.super_admin.passed.push('Firm Creation: Form validation present');
      } else {
        this.results.super_admin.failed.push(`Firm Creation: ${formTest.message}`);
      }
    }

    // Test User Management
    if (window.location.pathname.includes('/superadmin/users')) {
      const addUserBtn = document.querySelector('button:contains("Add"), button[onclick*="AddAdmin"]');
      if (addUserBtn || Array.from(document.querySelectorAll('button')).some(btn => btn.textContent.includes('Add'))) {
        this.results.super_admin.passed.push('User Management: Add User button exists');
      } else {
        this.results.super_admin.warnings.push('User Management: Add User button may be dynamically rendered');
      }
    }

    // Test Role Management
    if (window.location.pathname.includes('/superadmin/settings')) {
      // Check if role management tab exists
      const roleTab = Array.from(document.querySelectorAll('button, a')).find(el => 
        el.textContent.includes('Role Management') || el.textContent.includes('Role')
      );
      if (roleTab) {
        this.results.super_admin.passed.push('Role Management: Tab exists');
      } else {
        this.results.super_admin.warnings.push('Role Management: Tab may be in different location');
      }
    }

    // Test Audit Logs
    if (window.location.pathname.includes('/superadmin/settings')) {
      const logsTab = Array.from(document.querySelectorAll('button, a')).find(el => 
        el.textContent.includes('Logs') || el.textContent.includes('Audit')
      );
      if (logsTab) {
        this.results.super_admin.passed.push('Audit Logs: Tab exists');
      } else {
        this.results.super_admin.warnings.push('Audit Logs: Tab may be in different location');
      }
    }

    console.log('✅ Super Admin tests completed');
  }

  // Test Firm Admin features
  async testFirmAdmin() {
    this.currentRole = 'admin';
    console.log('🧪 Testing Firm Admin Role...');

    const firmAdminLinks = [
      '/firmadmin',
      '/firmadmin/dashboard',
      '/firmadmin/staff',
      '/firmadmin/clients',
      '/firmadmin/calendar',
      '/firmadmin/documents',
      '/firmadmin/messages',
      '/firmadmin/settings'
    ];

    firmAdminLinks.forEach(link => {
      const linkElement = document.querySelector(`a[href="${link}"]`);
      if (linkElement) {
        this.results.admin.passed.push(`Link exists: ${link}`);
      } else {
        this.results.admin.warnings.push(`Link not found in DOM: ${link} (may be rendered dynamically)`);
      }
    });

    // Test Staff Management
    if (window.location.pathname.includes('/firmadmin/staff')) {
      const addStaffBtn = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent.includes('Add Staff') || btn.textContent.includes('Add Staff Member')
      );
      if (addStaffBtn) {
        this.results.admin.passed.push('Staff Management: Add Staff button exists');
      } else {
        this.results.admin.failed.push('Staff Management: Add Staff button not found');
      }
    }

    // Test Client Management
    if (window.location.pathname.includes('/firmadmin/clients')) {
      this.results.admin.passed.push('Client Management: Page accessible');
    }

    // Test Appointments
    if (window.location.pathname.includes('/firmadmin/calendar')) {
      this.results.admin.passed.push('Appointments: Calendar page accessible');
    }

    // Test Documents
    if (window.location.pathname.includes('/firmadmin/documents')) {
      this.results.admin.passed.push('Documents: Document management accessible');
    }

    // Test Notifications
    const notificationIcon = document.querySelector('[aria-label*="notification"], .notification-icon, [class*="notification"]');
    if (notificationIcon) {
      this.results.admin.passed.push('Notifications: Notification icon exists');
    } else {
      this.results.admin.warnings.push('Notifications: Notification icon may be in different location');
    }

    console.log('✅ Firm Admin tests completed');
  }

  // Test Client features
  async testClient() {
    this.currentRole = 'client';
    console.log('🧪 Testing Client Role...');

    const clientLinks = [
      '/dashboard',
      '/documents',
      '/invoices',
      '/messages',
      '/appointments',
      '/accounts'
    ];

    clientLinks.forEach(link => {
      const linkElement = document.querySelector(`a[href="${link}"]`);
      if (linkElement) {
        this.results.client.passed.push(`Link exists: ${link}`);
      } else {
        this.results.client.warnings.push(`Link not found in DOM: ${link} (may be rendered dynamically)`);
      }
    });

    // Test forms
    const forms = document.querySelectorAll('form');
    if (forms.length > 0) {
      this.results.client.passed.push(`Found ${forms.length} form(s) on page`);
    }

    console.log('✅ Client tests completed');
  }

  // Generate report
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {},
      details: this.results
    };

    Object.keys(this.results).forEach(role => {
      const roleResults = this.results[role];
      const total = roleResults.passed.length + roleResults.failed.length + roleResults.warnings.length;
      const passRate = total > 0 ? ((roleResults.passed.length / total) * 100).toFixed(1) : 0;
      
      report.summary[role] = {
        total,
        passed: roleResults.passed.length,
        failed: roleResults.failed.length,
        warnings: roleResults.warnings.length,
        passRate: `${passRate}%`
      };
    });

    return report;
  }

  // Print report to console
  printReport() {
    const report = this.generateReport();
    
    console.log('\n' + '='.repeat(60));
    console.log('SMOKE TEST REPORT');
    console.log('='.repeat(60));
    console.log(`Timestamp: ${report.timestamp}\n`);

    Object.keys(report.summary).forEach(role => {
      const summary = report.summary[role];
      console.log(`\n${role.toUpperCase()}:`);
      console.log(`  Total Tests: ${summary.total}`);
      console.log(`  ✅ Passed: ${summary.passed}`);
      console.log(`  ❌ Failed: ${summary.failed}`);
      console.log(`  ⚠️  Warnings: ${summary.warnings}`);
      console.log(`  Pass Rate: ${summary.passRate}`);

      if (report.details[role].failed.length > 0) {
        console.log(`\n  Failed Tests:`);
        report.details[role].failed.forEach(fail => {
          console.log(`    - ${fail}`);
        });
      }

      if (report.details[role].warnings.length > 0) {
        console.log(`\n  Warnings:`);
        report.details[role].warnings.forEach(warn => {
          console.log(`    - ${warn}`);
        });
      }
    });

    console.log('\n' + '='.repeat(60));
    
    return report;
  }

  // Run all tests for current role
  async runTests() {
    const userType = localStorage.getItem('userType') || 
                    sessionStorage.getItem('userType') ||
                    (window.location.pathname.includes('superadmin') ? 'super_admin' :
                     window.location.pathname.includes('firmadmin') ? 'admin' : 'client');

    console.log(`Current user type detected: ${userType}`);

    switch(userType) {
      case 'super_admin':
        await this.testSuperAdmin();
        break;
      case 'admin':
        await this.testFirmAdmin();
        break;
      case 'client':
        await this.testClient();
        break;
      default:
        console.warn('Unknown user type, running all tests...');
        await this.testSuperAdmin();
        await this.testFirmAdmin();
        await this.testClient();
    }

    return this.printReport();
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SmokeTestSuite;
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  window.SmokeTestSuite = SmokeTestSuite;
  console.log('Smoke Test Suite loaded. Run: const test = new SmokeTestSuite(); await test.runTests();');
}

