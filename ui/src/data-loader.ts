import type { Scenario, ToolDefinition, World } from '../../src/types.ts';
import baseWorldJson from '../../data/base-world.json';
import scenariosJson from '../../data/scenarios.json';
import toolsJson from '../../data/tools.json';
import rulesJson from '../../data/rules.json';

export function loadBrowserScenarios(): Scenario[] {
  const baseWorld = baseWorldJson as World;
  const scenariosData = scenariosJson as any;

  if (scenariosData.format !== 'shared-world-v1') {
    return scenariosData.scenarios as Scenario[];
  }

  return scenariosData.scenarios.map((stored: any) => {
    const { world_patch, ...scenario } = stored;
    const world = structuredClone(baseWorld);

    for (const patch of world_patch || []) {
      const parts = patch.path.split('/').slice(1);
      if (!['accounts', 'folders', 'files'].includes(parts[0]) || parts.some((p: string) => ['__proto__', 'prototype', 'constructor'].includes(p))) {
        throw new Error('INVALID_FIXTURE_PATCH');
      }

      let node: any = world;
      for (const part of parts.slice(0, -1)) {
        if (!Object.hasOwn(node, part)) throw new Error('INVALID_PATCH_PATH');
        node = node[part];
      }

      const key = parts.at(-1)!;
      if (patch.op === 'add' && Array.isArray(node) && key === '-') {
        node.push(structuredClone(patch.value));
      } else if (patch.op === 'replace' && Object.hasOwn(node, key)) {
        node[key] = structuredClone(patch.value);
      } else {
        throw new Error('UNSUPPORTED_FIXTURE_PATCH');
      }
    }

    return { ...scenario, world } as Scenario;
  });
}

export const loadBrowserTools = (): ToolDefinition[] => (toolsJson as any).tools as ToolDefinition[];
export const loadBrowserRules = () => rulesJson as any;
