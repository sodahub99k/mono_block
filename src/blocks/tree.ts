import { canHaveNext, isReporter } from "./catalog";
import type { Block, Script, Value } from "../project/types";

export function walk(block: Block, fn: (b: Block) => void): void {
  fn(block);
  for (const v of Object.values(block.args)) {
    if (v.kind === "block") walk(v.block, fn);
  }
  if (block.next) walk(block.next, fn);
  if (block.substk) walk(block.substk, fn);
  if (block.substk2) walk(block.substk2, fn);
}

export function collectIds(block: Block): Set<string> {
  const ids = new Set<string>();
  walk(block, (b) => ids.add(b.id));
  return ids;
}

export function cloneTree(block: Block): Block {
  const args: Record<string, Value> = {};
  for (const [k, v] of Object.entries(block.args)) {
    args[k] =
      v.kind === "block"
        ? { kind: "block", block: cloneTree(v.block) }
        : { kind: "literal", value: v.value };
  }
  return {
    id: crypto.randomUUID(),
    op: block.op,
    args,
    next: block.next ? cloneTree(block.next) : undefined,
    substk: block.substk ? cloneTree(block.substk) : undefined,
    substk2: block.substk2 ? cloneTree(block.substk2) : undefined,
  };
}

export function appendChain(head: Block, tail: Block): Block {
  if (!canHaveNext(head.op)) return head;
  if (!head.next) return { ...head, next: tail };
  return { ...head, next: appendChain(head.next, tail) };
}

export function updateBlock(
  root: Block,
  id: string,
  fn: (b: Block) => Block,
): Block {
  if (root.id === id) return fn(root);

  let changed = false;
  const args: Record<string, Value> = { ...root.args };
  for (const [k, v] of Object.entries(args)) {
    if (v.kind === "block") {
      const u = updateBlock(v.block, id, fn);
      if (u !== v.block) {
        args[k] = { kind: "block", block: u };
        changed = true;
      }
    }
  }
  const next = root.next ? updateBlock(root.next, id, fn) : undefined;
  const substk = root.substk ? updateBlock(root.substk, id, fn) : undefined;
  const substk2 = root.substk2 ? updateBlock(root.substk2, id, fn) : undefined;
  if (next !== root.next || substk !== root.substk || substk2 !== root.substk2) {
    changed = true;
  }
  if (!changed) return root;
  return { ...root, args, next, substk, substk2 };
}

export function setArgLiteral(
  root: Block,
  id: string,
  name: string,
  value: string,
): Block {
  return updateBlock(root, id, (b) => ({
    ...b,
    args: { ...b.args, [name]: { kind: "literal", value } },
  }));
}

export type DetachResult = { rest: Block | null; detached: Block };

export function detachFromBlock(root: Block, id: string): DetachResult | null {
  if (root.id === id) return { rest: null, detached: root };

  if (root.next?.id === id) {
    return { rest: { ...root, next: undefined }, detached: root.next };
  }
  if (root.substk?.id === id) {
    return { rest: { ...root, substk: undefined }, detached: root.substk };
  }
  if (root.substk2?.id === id) {
    return { rest: { ...root, substk2: undefined }, detached: root.substk2 };
  }
  for (const [k, v] of Object.entries(root.args)) {
    if (v.kind === "block" && v.block.id === id) {
      const args = { ...root.args };
      delete args[k];
      return { rest: { ...root, args }, detached: v.block };
    }
  }

  if (root.next) {
    const r = detachFromBlock(root.next, id);
    if (r) {
      return { rest: { ...root, next: r.rest ?? undefined }, detached: r.detached };
    }
  }
  if (root.substk) {
    const r = detachFromBlock(root.substk, id);
    if (r) {
      return {
        rest: { ...root, substk: r.rest ?? undefined },
        detached: r.detached,
      };
    }
  }
  if (root.substk2) {
    const r = detachFromBlock(root.substk2, id);
    if (r) {
      return {
        rest: { ...root, substk2: r.rest ?? undefined },
        detached: r.detached,
      };
    }
  }
  for (const [k, v] of Object.entries(root.args)) {
    if (v.kind === "block") {
      const r = detachFromBlock(v.block, id);
      if (r) {
        const args = { ...root.args };
        if (r.rest) args[k] = { kind: "block", block: r.rest };
        else delete args[k];
        return { rest: { ...root, args }, detached: r.detached };
      }
    }
  }
  return null;
}

export function detachFromScript(
  script: Script,
  id: string,
): { script: Script | null; detached: Block | null } {
  const r = detachFromBlock(script.top, id);
  if (!r) return { script, detached: null };
  if (!r.rest) return { script: null, detached: r.detached };
  return { script: { ...script, top: r.rest }, detached: r.detached };
}

export type ConnSlot = "next" | "substk" | "substk2" | `arg:${string}`;

export function attachTo(
  root: Block,
  hostId: string,
  slot: ConnSlot,
  incoming: Block,
): Block {
  return updateBlock(root, hostId, (b) => {
    if (slot === "next") {
      return { ...b, next: b.next ? appendChain(incoming, b.next) : incoming };
    }
    if (slot === "substk") {
      return {
        ...b,
        substk: b.substk ? appendChain(incoming, b.substk) : incoming,
      };
    }
    if (slot === "substk2") {
      return {
        ...b,
        substk2: b.substk2 ? appendChain(incoming, b.substk2) : incoming,
      };
    }
    const name = slot.slice(4);
    return {
      ...b,
      args: { ...b.args, [name]: { kind: "block", block: incoming } },
    };
  });
}

export function containsId(root: Block, id: string): boolean {
  let found = false;
  walk(root, (b) => {
    if (b.id === id) found = true;
  });
  return found;
}

export function isReporterTree(block: Block): boolean {
  return isReporter(block.op);
}
