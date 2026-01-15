/**
 * Status Registry Tests
 *
 * Unit tests for the StatusRegistry class and helper functions.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  StatusRegistry,
  defaultStatusRegistry,
  createStatusRegistry,
  mergeStatusConfig,
  DEFAULT_STATUSES,
  DEFAULT_MAPPINGS,
  FEEDBACK_TYPE_ICONS,
  type StatusDefinition,
} from '../../../src/registry/statusRegistry';

describe('StatusRegistry', () => {
  describe('initialization', () => {
    it('should initialize with default statuses', () => {
      const registry = new StatusRegistry();
      const statuses = registry.getAll();

      expect(statuses.length).toBeGreaterThan(0);
      expect(statuses.length).toBe(DEFAULT_STATUSES.length);
    });

    it('should initialize with custom statuses', () => {
      const customStatuses: StatusDefinition[] = [
        {
          key: 'custom1',
          label: 'Custom 1',
          color: '#000',
          bgColor: '#fff',
          textColor: '#000',
          icon: 'AlertCircle',
          order: 1,
          isTerminal: false,
        },
      ];

      const registry = new StatusRegistry({
        statuses: customStatuses,
        mappings: [],
      });

      expect(registry.getAll().length).toBe(1);
      expect(registry.get('custom1')).toBeDefined();
    });

    it('should set default status key', () => {
      const registry = new StatusRegistry({ defaultStatus: 'inProgress' });
      expect(registry.getDefault()).toBe('inProgress');
    });
  });

  describe('get()', () => {
    it('should return status definition by key', () => {
      const registry = new StatusRegistry();
      const status = registry.get('new');

      expect(status).toBeDefined();
      expect(status?.label).toBe('New');
      expect(status?.key).toBe('new');
    });

    it('should return undefined for unknown key', () => {
      const registry = new StatusRegistry();
      expect(registry.get('unknown')).toBeUndefined();
    });
  });

  describe('getAll()', () => {
    it('should return all statuses sorted by order', () => {
      const registry = new StatusRegistry();
      const statuses = registry.getAll();

      for (let i = 1; i < statuses.length; i++) {
        expect(statuses[i].order).toBeGreaterThanOrEqual(statuses[i - 1].order);
      }
    });
  });

  describe('getActiveStatuses()', () => {
    it('should return only non-terminal statuses', () => {
      const registry = new StatusRegistry();
      const active = registry.getActiveStatuses();

      expect(active.every((s) => !s.isTerminal)).toBe(true);
      expect(active.length).toBeGreaterThan(0);
    });
  });

  describe('getTerminalStatuses()', () => {
    it('should return only terminal statuses', () => {
      const registry = new StatusRegistry();
      const terminal = registry.getTerminalStatuses();

      expect(terminal.every((s) => s.isTerminal)).toBe(true);
      expect(terminal.length).toBeGreaterThan(0);
    });
  });

  describe('registerStatus()', () => {
    let registry: StatusRegistry;

    beforeEach(() => {
      registry = new StatusRegistry();
    });

    it('should add a new status', () => {
      const newStatus: StatusDefinition = {
        key: 'testing',
        label: 'Testing',
        color: '#06b6d4',
        bgColor: '#ecfeff',
        textColor: '#0891b2',
        icon: 'Eye',
        order: 4.5,
        isTerminal: false,
      };

      registry.registerStatus(newStatus);
      const status = registry.get('testing');

      expect(status).toBeDefined();
      expect(status?.label).toBe('Testing');
    });

    it('should override existing status with same key', () => {
      const updatedNew: StatusDefinition = {
        key: 'new',
        label: 'Brand New',
        color: '#ff0000',
        bgColor: '#fee',
        textColor: '#c00',
        icon: 'AlertCircle',
        order: 1,
        isTerminal: false,
      };

      registry.registerStatus(updatedNew);
      const status = registry.get('new');

      expect(status?.label).toBe('Brand New');
      expect(status?.color).toBe('#ff0000');
    });
  });

  describe('unregisterStatus()', () => {
    it('should remove a status', () => {
      const registry = new StatusRegistry();

      expect(registry.has('new')).toBe(true);
      const removed = registry.unregisterStatus('new');

      expect(removed).toBe(true);
      expect(registry.has('new')).toBe(false);
    });

    it('should return false for non-existent status', () => {
      const registry = new StatusRegistry();
      expect(registry.unregisterStatus('nonexistent')).toBe(false);
    });
  });

  describe('addMapping() and removeMapping()', () => {
    let registry: StatusRegistry;

    beforeEach(() => {
      registry = new StatusRegistry();
    });

    it('should add a new mapping', () => {
      registry.addMapping('qa', 'underReview');
      expect(registry.normalize('qa')).toBe('underReview');
    });

    it('should handle case-insensitive mappings', () => {
      registry.addMapping('QA', 'underReview');
      expect(registry.normalize('qa')).toBe('underReview');
      expect(registry.normalize('QA')).toBe('underReview');
    });

    it('should remove a mapping', () => {
      registry.addMapping('custom', 'new');
      expect(registry.normalize('custom')).toBe('new');

      const removed = registry.removeMapping('custom');
      expect(removed).toBe(true);
      expect(registry.normalize('custom')).toBe('new'); // Falls back to default
    });
  });

  describe('normalize()', () => {
    let registry: StatusRegistry;

    beforeEach(() => {
      registry = new StatusRegistry();
    });

    it('should return default for null/undefined', () => {
      expect(registry.normalize(null)).toBe('new');
      expect(registry.normalize(undefined)).toBe('new');
    });

    it('should return direct status key if registered', () => {
      expect(registry.normalize('inProgress')).toBe('inProgress');
    });

    it('should normalize common aliases', () => {
      expect(registry.normalize('reported')).toBe('new');
      expect(registry.normalize('doing')).toBe('inProgress');
      expect(registry.normalize('review')).toBe('underReview');
      expect(registry.normalize('hold')).toBe('onHold');
      expect(registry.normalize('done')).toBe('resolved');
      expect(registry.normalize('archived')).toBe('closed');
      expect(registry.normalize('rejected')).toBe('wontFix');
    });

    it('should be case-insensitive for mappings', () => {
      expect(registry.normalize('REPORTED')).toBe('new');
      expect(registry.normalize('Doing')).toBe('inProgress');
    });

    it('should return default for unknown status', () => {
      expect(registry.normalize('completely_unknown')).toBe('new');
    });
  });

  describe('has()', () => {
    it('should return true for registered status', () => {
      const registry = new StatusRegistry();
      expect(registry.has('new')).toBe(true);
      expect(registry.has('inProgress')).toBe(true);
    });

    it('should return false for unregistered status', () => {
      const registry = new StatusRegistry();
      expect(registry.has('nonexistent')).toBe(false);
    });
  });

  describe('getDefault() and setDefault()', () => {
    it('should return current default', () => {
      const registry = new StatusRegistry();
      expect(registry.getDefault()).toBe('new');
    });

    it('should set new default if valid', () => {
      const registry = new StatusRegistry();
      registry.setDefault('inProgress');
      expect(registry.getDefault()).toBe('inProgress');
    });

    it('should not set default for non-existent status', () => {
      const registry = new StatusRegistry();
      registry.setDefault('nonexistent' as any);
      expect(registry.getDefault()).toBe('new');
    });
  });

  describe('toRecord()', () => {
    it('should convert to Record<string, StatusConfig>', () => {
      const registry = new StatusRegistry();
      const record = registry.toRecord();

      expect(typeof record).toBe('object');
      expect(record.new).toBeDefined();
      expect(record.new.label).toBe('New');
      expect(record.new.color).toBe('#3b82f6');
    });
  });

  describe('fromRecord()', () => {
    it('should create registry from Record', () => {
      const record = {
        status1: {
          label: 'Status 1',
          color: '#000',
          bgColor: '#fff',
          textColor: '#000',
          icon: 'AlertCircle' as const,
        },
        status2: {
          label: 'Status 2',
          color: '#111',
          bgColor: '#eee',
          textColor: '#111',
          icon: 'CheckCircle' as const,
        },
      };

      const registry = StatusRegistry.fromRecord(record, 'status1');

      expect(registry.getAll().length).toBe(2);
      expect(registry.getDefault()).toBe('status1');
      expect(registry.get('status1')?.label).toBe('Status 1');
    });
  });
});

describe('defaultStatusRegistry', () => {
  it('should be pre-initialized with defaults', () => {
    expect(defaultStatusRegistry.has('new')).toBe(true);
    expect(defaultStatusRegistry.has('inProgress')).toBe(true);
    expect(defaultStatusRegistry.has('resolved')).toBe(true);
  });

  it('should normalize common status aliases', () => {
    expect(defaultStatusRegistry.normalize('reported')).toBe('new');
    expect(defaultStatusRegistry.normalize('done')).toBe('resolved');
  });
});

describe('createStatusRegistry()', () => {
  it('should create registry with merged statuses', () => {
    const customStatus: StatusDefinition = {
      key: 'testing',
      label: 'Testing',
      color: '#06b6d4',
      bgColor: '#ecfeff',
      textColor: '#0891b2',
      icon: 'Eye',
      order: 4.5,
      isTerminal: false,
    };

    const registry = createStatusRegistry([customStatus]);

    expect(registry.has('new')).toBe(true); // Default
    expect(registry.has('testing')).toBe(true); // Custom
  });
});

describe('mergeStatusConfig()', () => {
  it('should merge custom config with defaults', () => {
    const custom = {
      new: { label: 'Brand New' },
      custom: { label: 'Custom Status', color: '#ff0000' },
    };

    const merged = mergeStatusConfig(custom);

    expect(merged.new.label).toBe('Brand New');
    expect(merged.new.color).toBe('#3b82f6'); // Keeps default color
    expect(merged.custom.label).toBe('Custom Status');
    expect(merged.custom.color).toBe('#ff0000');
  });
});

describe('DEFAULT_STATUSES', () => {
  it('should contain expected core statuses', () => {
    const keys = DEFAULT_STATUSES.map((s) => s.key);

    expect(keys).toContain('new');
    expect(keys).toContain('inProgress');
    expect(keys).toContain('underReview');
    expect(keys).toContain('onHold');
    expect(keys).toContain('resolved');
    expect(keys).toContain('closed');
    expect(keys).toContain('wontFix');
  });

  it('should have proper structure', () => {
    for (const status of DEFAULT_STATUSES) {
      expect(status.key).toBeDefined();
      expect(status.label).toBeDefined();
      expect(status.color).toBeDefined();
      expect(status.bgColor).toBeDefined();
      expect(status.textColor).toBeDefined();
      expect(status.icon).toBeDefined();
      expect(typeof status.order).toBe('number');
      expect(typeof status.isTerminal).toBe('boolean');
    }
  });
});

describe('DEFAULT_MAPPINGS', () => {
  it('should contain common aliases', () => {
    const fromValues = DEFAULT_MAPPINGS.map((m) => m.from);

    expect(fromValues).toContain('reported');
    expect(fromValues).toContain('doing');
    expect(fromValues).toContain('done');
    expect(fromValues).toContain('archived');
    expect(fromValues).toContain('rejected');
  });
});

describe('FEEDBACK_TYPE_ICONS', () => {
  it('should contain feedback type icons', () => {
    expect(FEEDBACK_TYPE_ICONS.bug).toBeDefined();
    expect(FEEDBACK_TYPE_ICONS.feature).toBeDefined();
    expect(FEEDBACK_TYPE_ICONS.improvement).toBeDefined();
    expect(FEEDBACK_TYPE_ICONS.question).toBeDefined();
  });
});
