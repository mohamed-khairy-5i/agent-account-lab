import { readFileSync } from 'node:fs';
import type { Scenario, ToolDefinition } from './types.ts';
const read = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
export function loadScenarios(): Scenario[] {
  const source=read('../data/scenarios.json');
  if(source.format!=='shared-world-v1') return source.scenarios;
  if(source.base_world_file!=='base-world.json') throw new Error('UNSUPPORTED_BASE_WORLD');
  const base=read('../data/base-world.json');
  return source.scenarios.map((stored:any)=>{
    const {world_patch,...scenario}=stored;
    const world=structuredClone(base);
    for(const patch of world_patch) {
      const parts=patch.path.split('/').slice(1);
      if(!['accounts','folders','files'].includes(parts[0]) || parts.some((p:string)=>['__proto__','prototype','constructor'].includes(p))) throw new Error('INVALID_FIXTURE_PATCH');
      let node:any=world;
      for(const part of parts.slice(0,-1)) {
        if(!Object.hasOwn(node,part)) throw new Error('INVALID_PATCH_PATH');
        node=node[part];
      }
      const key=parts.at(-1)!;
      if(patch.op==='add' && Array.isArray(node) && key==='-') node.push(structuredClone(patch.value));
      else if(patch.op==='replace' && Object.hasOwn(node,key)) node[key]=structuredClone(patch.value);
      else throw new Error('UNSUPPORTED_FIXTURE_PATCH');
    }
    return {...scenario,world};
  });
}
export const loadTools = (): ToolDefinition[] => read('../data/tools.json').tools;
export const loadRules = () => read('../data/rules.json');
