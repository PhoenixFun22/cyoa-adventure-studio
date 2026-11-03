import { AdventureProject } from '../types/cyoa';

/**
 * Generates a standalone, fully self-contained Python script using standard library Tkinter.
 * Bundles:
 * - All assets (embedded image base64, items, metrics, narrative blocks)
 * - Independent Lootbox rolling engine directly within the script
 * - Dynamic circular metric rings drawn clockwise from top on Canvas
 * - Top-middle narrative box and choice buttons
 * - Bottom scrollable inventory bar with image rendering
 * - Requirement checking ("requires key!", "requires keys! (N)", "Unsuccessful!")
 */
export function generatePythonScript(adventure: AdventureProject): string {
  // Strip out any invalid base64 prefixes to give raw base64 payload where needed
  const sanitizedAdventure = {
    ...adventure,
    items: adventure.items.map((it) => {
      let rawBase64 = '';
      if (it.imageUrl && it.imageUrl.startsWith('data:image/')) {
        const parts = it.imageUrl.split(',');
        if (parts.length > 1) {
          rawBase64 = parts[1];
        }
      }
      return {
        ...it,
        rawBase64,
      };
    }),
  };

  const jsonAdventure = JSON.stringify(sanitizedAdventure, null, 2);

  return `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Choose Your Own Adventure - Standalone Game
Adventure Title: ${adventure.title.replace(/"/g, '\\"')}
Generated with CYOA Adventure Studio
Fully self-contained: bundles all assets, items, metrics, and procedural lootbox engine.
"""

import sys
import math
import json
import base64
import random
import tkinter as tk
from tkinter import messagebox

# ==============================================================================
# BUNDLED ADVENTURE DATA & EMBEDDED ASSETS
# ==============================================================================
ADVENTURE_DATA = json.loads(r'''${jsonAdventure.replace(/\\/g, '\\\\')}''')

class AdventureGameGUI:
    def __init__(self, root, adventure):
        self.root = root
        self.adventure = adventure
        self.title = adventure.get("title", "CYOA Adventure")
        self.root.title(f"{self.title} - Choose Your Own Adventure")
        self.root.geometry("1040x740")
        self.root.minsize(860, 600)
        self.root.configure(bg="#0B0F17")

        # Game State Mappings
        self.blocks_by_id = {b["id"]: b for b in adventure.get("blocks", [])}
        self.items_by_id = {it["id"]: it for it in adventure.get("items", [])}
        self.metrics_by_id = {m["id"]: m for m in adventure.get("metrics", [])}
        self.presets_by_id = {p["id"]: p for p in adventure.get("presets", [])}

        # Initialize Player Metrics
        self.metrics = {}
        for m in adventure.get("metrics", []):
            self.metrics[m["id"]] = m.get("initialValue", 100)

        # Initialize Player Inventory: itemId -> quantity
        self.inventory = {}
        for it in adventure.get("items", []):
            qty = it.get("initialQuantity", 0)
            if qty > 0:
                self.inventory[it["id"]] = qty

        # Track completed options for graying out
        self.completed_options = set()

        # Cache decoded PhotoImages for inventory slots
        self.photo_cache = {}
        self._load_image_assets()

        # Determine starting block
        start_block = None
        for b in adventure.get("blocks", []):
            if b.get("isStart", False):
                start_block = b
                break
        if not start_block and adventure.get("blocks"):
            start_block = adventure["blocks"][0]

        self.current_block_id = start_block["id"] if start_block else ""
        self.visited_blocks = [self.current_block_id] if self.current_block_id else []

        self._build_ui()
        self.render_current_block()
        self.update_hud()

    def _load_image_assets(self):
        """Preload bundled base64 image assets into Tkinter PhotoImages."""
        for it in self.adventure.get("items", []):
            it_id = it.get("id")
            raw_b64 = it.get("rawBase64", "")
            if raw_b64:
                try:
                    img = tk.PhotoImage(data=raw_b64)
                    # Downscale if image is too large for inventory slot
                    w = img.width()
                    h = img.height()
                    if w > 64 or h > 64:
                        subsample_factor = max(1, max(w // 48, h // 48))
                        img = img.subsample(subsample_factor, subsample_factor)
                    self.photo_cache[it_id] = img
                except Exception:
                    self.photo_cache[it_id] = None

    def _build_ui(self):
        self.main_container = tk.Frame(self.root, bg="#0B0F17")
        self.main_container.pack(fill=tk.BOTH, expand=True, padx=20, pady=16)

        # Header Title Bar
        header = tk.Frame(self.main_container, bg="#0B0F17")
        header.pack(fill=tk.X, pady=(0, 10))

        self.title_label = tk.Label(
            header,
            text=self.title.upper(),
            font=("Georgia", 16, "bold"),
            fg="#F1F5F9",
            bg="#0B0F17"
        )
        self.title_label.pack(side=tk.LEFT)

        self.restart_btn = tk.Button(
            header,
            text="Restart Story",
            font=("Arial", 9),
            bg="#1E293B",
            fg="#94A3B8",
            activebackground="#334155",
            activeforeground="#FFFFFF",
            relief=tk.FLAT,
            padx=12,
            pady=4,
            command=self.restart_game
        )
        self.restart_btn.pack(side=tk.RIGHT)

        # Upper Stage: Narrative Box and Available Choices
        upper_frame = tk.Frame(self.main_container, bg="#0B0F17")
        upper_frame.pack(fill=tk.BOTH, expand=True)

        # Top-Middle Narrative Frame
        narrative_border = tk.Frame(upper_frame, bg="#334155", bd=1, relief=tk.SOLID)
        narrative_border.pack(fill=tk.BOTH, expand=True, pady=(0, 12))

        self.narrative_frame = tk.Frame(narrative_border, bg="#131C2E", padx=24, pady=18)
        self.narrative_frame.pack(fill=tk.BOTH, expand=True)

        self.block_title_lbl = tk.Label(
            self.narrative_frame,
            text="Narrative Chapter",
            font=("Georgia", 14, "bold"),
            fg="#F8FAFC",
            bg="#131C2E",
            anchor="w"
        )
        self.block_title_lbl.pack(fill=tk.X, pady=(0, 8))

        self.narrative_txt = tk.Text(
            self.narrative_frame,
            font=("Arial", 11),
            fg="#CBD5E1",
            bg="#131C2E",
            wrap=tk.WORD,
            relief=tk.FLAT,
            padx=4,
            pady=4,
            height=7
        )
        self.narrative_txt.pack(fill=tk.BOTH, expand=True)
        self.narrative_txt.config(state=tk.DISABLED)

        # Below Narrative Box: Choices / Options List
        options_border = tk.Frame(upper_frame, bg="#1E293B", bd=1)
        options_border.pack(fill=tk.X, pady=(0, 12))

        self.options_container = tk.Frame(options_border, bg="#0F172A", padx=16, pady=12)
        self.options_container.pack(fill=tk.X)

        self.options_lbl = tk.Label(
            self.options_container,
            text="AVAILABLE ACTIONS & CHOICES",
            font=("Arial", 9, "bold"),
            fg="#64748B",
            bg="#0F172A",
            anchor="w"
        )
        self.options_lbl.pack(fill=tk.X, pady=(0, 6))

        self.options_buttons_frame = tk.Frame(self.options_container, bg="#0F172A")
        self.options_buttons_frame.pack(fill=tk.X)

        # Bottom HUD Section: Bottom-Left Metric Rings & Bottom Inventory Bar
        bottom_hud = tk.Frame(self.main_container, bg="#0B0F17", height=140)
        bottom_hud.pack(fill=tk.X, side=tk.BOTTOM)

        # Left: Circular Metric Rings Canvas
        self.metrics_frame = tk.Frame(bottom_hud, bg="#0B0F17")
        self.metrics_frame.pack(side=tk.LEFT, fill=tk.Y, padx=(0, 16))

        self.metrics_title = tk.Label(
            self.metrics_frame,
            text="VITAL METRICS",
            font=("Arial", 8, "bold"),
            fg="#64748B",
            bg="#0B0F17",
            anchor="w"
        )
        self.metrics_title.pack(anchor="w", pady=(0, 2))

        self.rings_canvas = tk.Canvas(
            self.metrics_frame,
            bg="#0B0F17",
            highlightthickness=0,
            height=110,
            width=max(260, len(self.adventure.get("metrics", [])) * 90)
        )
        self.rings_canvas.pack(side=tk.LEFT, fill=tk.BOTH)

        # Right: Inventory Bar
        inventory_border = tk.Frame(bottom_hud, bg="#334155", bd=1)
        inventory_border.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        self.inventory_frame = tk.Frame(inventory_border, bg="#0F172A", padx=14, pady=10)
        self.inventory_frame.pack(fill=tk.BOTH, expand=True)

        inv_header = tk.Frame(self.inventory_frame, bg="#0F172A")
        inv_header.pack(fill=tk.X, pady=(0, 6))

        tk.Label(
            inv_header,
            text="INVENTORY POUCH",
            font=("Arial", 9, "bold"),
            fg="#94A3B8",
            bg="#0F172A"
        ).pack(side=tk.LEFT)

        self.inventory_slots_frame = tk.Frame(self.inventory_frame, bg="#0F172A")
        self.inventory_slots_frame.pack(fill=tk.X, expand=True)

    def draw_metric_rings(self):
        """Draws circular rings going clockwise from 12 o'clock; dark black where unfilled."""
        self.rings_canvas.delete("all")
        metrics = self.adventure.get("metrics", [])
        if not metrics:
            return

        canvas_width = max(260, len(metrics) * 90)
        self.rings_canvas.config(width=canvas_width)

        x_offset = 45
        for m in metrics:
            m_id = m["id"]
            name = m.get("name", "Metric")
            color = m.get("color", "#0284c7")
            max_val = max(1, m.get("maxValue", 100))
            curr_val = max(0, min(max_val, self.metrics.get(m_id, 100)))

            cy = 55
            cx = x_offset
            radius = 32
            thickness = 7

            # Metric Name above ring
            self.rings_canvas.create_text(
                cx, cy - radius - 10,
                text=name.upper(),
                font=("Arial", 8, "bold"),
                fill="#94A3B8"
            )

            # Black / dark unfilled circular background track
            bbox = (cx - radius, cy - radius, cx + radius, cy + radius)
            self.rings_canvas.create_oval(
                bbox,
                outline="#1E293B",
                width=thickness
            )

            # Clockwise fill from top (90 deg start, negative extent for clockwise)
            fraction = curr_val / max_val
            extent_angle = - (fraction * 359.9)

            if fraction > 0:
                self.rings_canvas.create_arc(
                    bbox,
                    start=90,
                    extent=extent_angle,
                    style=tk.ARC,
                    outline=color,
                    width=thickness
                )

            # Inside legible text: "current | max"
            value_str = f"{int(curr_val)} | {int(max_val)}"
            self.rings_canvas.create_text(
                cx, cy,
                text=value_str,
                font=("Courier", 8, "bold"),
                fill="#F8FAFC"
            )

            x_offset += 90

    def update_inventory_ui(self):
        for child in self.inventory_slots_frame.winfo_children():
            child.destroy()

        active_items = []
        for it_id, qty in self.inventory.items():
            if qty > 0 and it_id in self.items_by_id:
                active_items.append((self.items_by_id[it_id], qty))

        if not active_items:
            empty_lbl = tk.Label(
                self.inventory_slots_frame,
                text="(Pouch is empty - discover items through choices and crates)",
                font=("Arial", 9, "italic"),
                fg="#64748B",
                bg="#0F172A"
            )
            empty_lbl.pack(side=tk.LEFT, pady=10)
            return

        for item, qty in active_items:
            slot = tk.Frame(
                self.inventory_slots_frame,
                bg="#1E293B",
                bd=1,
                relief=tk.SOLID,
                padx=8,
                pady=6
            )
            slot.pack(side=tk.LEFT, padx=(0, 8))

            it_id = item.get("id")
            cached_photo = self.photo_cache.get(it_id)

            if cached_photo:
                img_lbl = tk.Label(slot, image=cached_photo, bg="#1E293B")
                img_lbl.image = cached_photo
                img_lbl.pack(anchor="center", pady=(0, 2))

            name_lbl = tk.Label(
                slot,
                text=item.get("name", "Item"),
                font=("Arial", 9, "bold"),
                fg="#F1F5F9",
                bg="#1E293B"
            )
            name_lbl.pack(anchor="w")

            qty_lbl = tk.Label(
                slot,
                text=f"x{qty}",
                font=("Courier", 8, "bold"),
                fg="#38BDF8",
                bg="#1E293B"
            )
            qty_lbl.pack(anchor="w")

            if item.get("isUsable", False):
                use_btn_text = item.get("useLabel") or "Use"
                use_btn = tk.Button(
                    slot,
                    text=use_btn_text,
                    font=("Arial", 8, "bold"),
                    bg="#059669",
                    fg="#FFFFFF",
                    activebackground="#10B981",
                    relief=tk.FLAT,
                    padx=6,
                    pady=2,
                    cursor="hand2",
                    command=lambda it=item: self.use_inventory_item(it)
                )
                use_btn.pack(anchor="w", pady=(3, 0))

    def use_inventory_item(self, item):
        it_id = item.get("id")
        current_qty = self.inventory.get(it_id, 0)
        if current_qty <= 0:
            return

        effects_summary = []
        for eff in item.get("metricEffects", []):
            m_id = eff.get("metricId")
            delta = eff.get("delta", 0)
            if m_id in self.metrics:
                m_def = self.metrics_by_id.get(m_id, {})
                min_val = m_def.get("minValue", 0)
                max_val = m_def.get("maxValue", 100)
                self.metrics[m_id] = max(min_val, min(max_val, self.metrics[m_id] + delta))
                sign = "+" if delta >= 0 else ""
                effects_summary.append(f"{m_def.get('name', 'Metric')} {sign}{delta}")

        if item.get("consumable", True):
            self.inventory[it_id] -= 1
            if self.inventory[it_id] <= 0:
                del self.inventory[it_id]

        self._check_metric_triggers()
        self.update_hud()

        custom_msg = item.get("useMessage")
        if custom_msg:
            msg = custom_msg
        elif effects_summary:
            msg = f"Used {item.get('name', 'Item')}! ({', '.join(effects_summary)})"
        else:
            msg = f"Used {item.get('name', 'Item')}."

        action_label = item.get("useLabel") or "Used"
        messagebox.showinfo(f"{action_label} {item.get('name', 'Item')}", msg)

    def update_hud(self):
        self.draw_metric_rings()
        self.update_inventory_ui()

    def render_current_block(self):
        block = self.blocks_by_id.get(self.current_block_id)
        if not block:
            return

        is_ending = block.get("isEnding", False)
        title_prefix = "[ENDING] " if is_ending else ""
        self.block_title_lbl.config(
            text=f"{title_prefix}{block.get('title', 'Untitled Chapter')}",
            fg="#F59E0B" if is_ending else "#F8FAFC"
        )

        self.narrative_txt.config(state=tk.NORMAL)
        self.narrative_txt.delete("1.0", tk.END)
        self.narrative_txt.insert(tk.END, block.get("text", ""))
        self.narrative_txt.config(state=tk.DISABLED)

        # Clear existing buttons
        for child in self.options_buttons_frame.winfo_children():
            child.destroy()

        options = block.get("options", [])
        if not options:
            no_opt = tk.Label(
                self.options_buttons_frame,
                text="The tale concludes here.",
                font=("Arial", 10, "italic"),
                fg="#94A3B8",
                bg="#0F172A"
            )
            no_opt.pack(pady=8)
            return

        for opt in options:
            opt_id = opt.get("id", "")
            is_completed = opt_id in self.completed_options
            text = opt.get("text", "Continue")

            # Format requirement tag if present
            req_text = ""
            for act in opt.get("actions", []):
                if act.get("type") == "require_item":
                    r_id = act.get("itemId")
                    r_item = self.items_by_id.get(r_id, {})
                    r_qty = act.get("itemQuantity", 1)
                    item_name = r_item.get("name", "Item")
                    if r_qty > 1:
                        req_text = f" [requires {item_name}s! ({r_qty})]"
                    else:
                        req_text = f" [requires {item_name}!]"

            btn_text = f"{text}{req_text}"

            btn = tk.Button(
                self.options_buttons_frame,
                text=btn_text,
                font=("Arial", 10, "normal" if not is_completed else "italic"),
                anchor="w",
                justify=tk.LEFT,
                padx=12,
                pady=6,
                relief=tk.FLAT
            )

            if is_completed and opt.get("grayOutOnComplete", True):
                btn.config(
                    bg="#1E293B",
                    fg="#475569",
                    state=tk.DISABLED,
                    cursor="arrow"
                )
            else:
                btn.config(
                    bg="#1E293B",
                    fg="#E2E8F0",
                    activebackground="#334155",
                    activeforeground="#FFFFFF",
                    cursor="hand2",
                    command=lambda o=opt: self.on_select_option(o)
                )

            btn.pack(fill=tk.X, pady=3)

    def on_select_option(self, option):
        actions = option.get("actions", [])

        # Step 1: Check requirements
        for act in actions:
            if act.get("type") == "require_item":
                req_item_id = act.get("itemId")
                req_qty = act.get("itemQuantity", 1)
                item_obj = self.items_by_id.get(req_item_id, {})
                item_name = item_obj.get("name", "Item")
                current_qty = self.inventory.get(req_item_id, 0)

                if current_qty < req_qty:
                    messagebox.showwarning(
                        "Action Unsuccessful",
                        f"Unsuccessful! You do not have the required item: {item_name} (Need: {req_qty}, Possess: {current_qty})."
                    )
                    return

        # Step 2: Take required items (excess stays)
        for act in actions:
            if act.get("type") == "require_item":
                req_item_id = act.get("itemId")
                req_qty = act.get("itemQuantity", 1)
                self.inventory[req_item_id] -= req_qty
                if self.inventory[req_item_id] <= 0:
                    del self.inventory[req_item_id]

        # Step 3: Execute actions
        target_block = None

        for act in actions:
            a_type = act.get("type")

            if a_type == "narrative_nav":
                target_block = act.get("targetBlockId")

            elif a_type == "metric_delta":
                m_id = act.get("metricId")
                delta = act.get("metricDelta", 0)
                if m_id in self.metrics:
                    m_def = self.metrics_by_id.get(m_id, {})
                    min_val = m_def.get("minValue", 0)
                    max_val = m_def.get("maxValue", 100)
                    self.metrics[m_id] = max(min_val, min(max_val, self.metrics[m_id] + delta))

            elif a_type == "give_item":
                g_id = act.get("itemId")
                qty = act.get("itemQuantity", 1)
                self.inventory[g_id] = self.inventory.get(g_id, 0) + qty
                g_item = self.items_by_id.get(g_id, {})
                messagebox.showinfo("Item Acquired", f"You obtained: {g_item.get('name', 'Item')} x{qty}!")

            elif a_type == "take_item":
                t_id = act.get("itemId")
                qty = act.get("itemQuantity", 1)
                if t_id in self.inventory:
                    self.inventory[t_id] = max(0, self.inventory[t_id] - qty)
                    if self.inventory[t_id] == 0:
                        del self.inventory[t_id]

            elif a_type == "lootbox":
                self.run_independent_lootbox(act)

            elif a_type == "preset_call":
                p_id = act.get("presetId")
                preset = self.presets_by_id.get(p_id)
                if preset:
                    for p_act in preset.get("actions", []):
                        if p_act.get("type") == "metric_delta":
                            pm_id = p_act.get("metricId")
                            p_delta = p_act.get("metricDelta", 0)
                            if pm_id in self.metrics:
                                m_def = self.metrics_by_id.get(pm_id, {})
                                min_val = m_def.get("minValue", 0)
                                max_val = m_def.get("maxValue", 100)
                                self.metrics[pm_id] = max(min_val, min(max_val, self.metrics[pm_id] + p_delta))

        # Gray out option if configured
        if option.get("grayOutOnComplete", True):
            self.completed_options.add(option.get("id"))

        # Check metric threshold triggers
        self._check_metric_triggers()

        # Navigate
        if target_block and target_block in self.blocks_by_id:
            self.current_block_id = target_block
            self.visited_blocks.append(target_block)

        self.update_hud()
        self.render_current_block()

    def run_independent_lootbox(self, lootbox_action):
        """Bundled independent weighted roll lootbox engine."""
        entries = lootbox_action.get("lootboxEntries", [])
        if not entries:
            messagebox.showinfo("Empty Crate", "You opened the crate, but it was empty.")
            return

        rolls = max(1, lootbox_action.get("lootboxRolls", 1))
        won_items = []

        item_pool = []
        weights = []
        for e in entries:
            item_pool.append(e)
            weights.append(max(1, e.get("weight", 10)))

        for _ in range(rolls):
            chosen_entry = random.choices(item_pool, weights=weights, k=1)[0]
            it_id = chosen_entry.get("itemId")
            min_c = chosen_entry.get("minCount", 1)
            max_c = chosen_entry.get("maxCount", 1)
            count = random.randint(min_c, max_c)
            self.inventory[it_id] = self.inventory.get(it_id, 0) + count
            it_name = self.items_by_id.get(it_id, {}).get("name", "Item")
            won_items.append(f"{it_name} x{count}")

        summary = "\\n".join(won_items)
        messagebox.showinfo("Lootbox Opened!", f"You rolled the lootbox and uncovered:\\n\\n{summary}")

    def _check_metric_triggers(self):
        for m_def in self.adventure.get("metrics", []):
            m_id = m_def["id"]
            curr_val = self.metrics.get(m_id, 100)
            for trig in m_def.get("triggers", []):
                thresh = trig.get("threshold", 0)
                cond = trig.get("condition", "less_than_or_equal")
                triggered = False

                if cond == "less_than_or_equal" and curr_val <= thresh:
                    triggered = True
                elif cond == "greater_than_or_equal" and curr_val >= thresh:
                    triggered = True
                elif cond == "equals" and curr_val == thresh:
                    triggered = True

                if triggered:
                    notice = trig.get("noticeText")
                    if notice:
                        messagebox.showwarning(f"Vital Warning: {m_def.get('name')}", notice)

                    if trig.get("actionType") in ("ending", "goto_block"):
                        target = trig.get("targetBlockId")
                        if target and target in self.blocks_by_id:
                            self.current_block_id = target

    def restart_game(self):
        if messagebox.askyesno("Restart", "Restart your journey from the beginning?"):
            self.metrics.clear()
            for m in self.adventure.get("metrics", []):
                self.metrics[m["id"]] = m.get("initialValue", 100)

            self.inventory.clear()
            for it in self.adventure.get("items", []):
                qty = it.get("initialQuantity", 0)
                if qty > 0:
                    self.inventory[it["id"]] = qty

            self.completed_options.clear()
            start_block = None
            for b in self.adventure.get("blocks", []):
                if b.get("isStart", False):
                    start_block = b
                    break
            self.current_block_id = start_block["id"] if start_block else (self.adventure.get("blocks", [{}])[0].get("id", ""))
            self.update_hud()
            self.render_current_block()

def main():
    root = tk.Tk()
    app = AdventureGameGUI(root, ADVENTURE_DATA)
    root.mainloop()

if __name__ == "__main__":
    main()
`;
}
