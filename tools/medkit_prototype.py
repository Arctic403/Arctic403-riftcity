"""
tools/medkit_prototype.py

Engine-agnostic prototype for medkit purchase/use and save updates.
Commits to main on Arctic403/Arctic403-riftcity.

Usage:
  python tools/medkit_prototype.py

This is a lightweight reference implementation intended for porting into your game engine.
"""

import json
import uuid
import time
from datetime import datetime
from pathlib import Path

# --- Data models ------------------------------------------------------------

class Medkit:
    def __init__(self, id, name, cost, heal_percent=0.8, removes_penalties=True, hospital_only=True):
        self.id = id
        self.name = name
        self.cost = cost
        self.heal_percent = heal_percent
        self.removes_penalties = removes_penalties
        self.hospital_only = hospital_only


class Player:
    def __init__(self, player_id=None):
        self.player_id = player_id or str(uuid.uuid4())
        self.currency = 100
        self.health = 100
        self.max_health = 100
        self.inventory = {}  # item_id -> count
        self.is_hospitalized = False
        self.current_checkpoint = "start_region"
        self.choice_history = []

    def add_item(self, item_id, count=1):
        self.inventory[item_id] = self.inventory.get(item_id, 0) + count

    def remove_item(self, item_id, count=1):
        cur = self.inventory.get(item_id, 0)
        if cur <= 0:
            return False
        if cur <= count:
            del self.inventory[item_id]
            return True
        self.inventory[item_id] = cur - count
        return True

    def to_save_state(self):
        return {
            "health": self.health,
            "max_health": self.max_health,
            "currency": self.currency,
            "inventory": self.inventory.copy(),
        }


# --- Save & Telemetry stubs ------------------------------------------------

class SaveManager:
    SAVE_DIR = Path("saves")
    SAVE_DIR.mkdir(exist_ok=True)

    @staticmethod
    def write_checkpoint(player: Player, checkpoint_id: str, rng_seed: int = None, notes: dict = None):
        payload = {
            "version": "1.0",
            "player_id": player.player_id,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "checkpoint_id": checkpoint_id,
            "player_state": player.to_save_state(),
            "choice_history": player.choice_history,
            "rng_seed": rng_seed or int(time.time()),
            "notes": notes or {},
        }
        filename = SaveManager.SAVE_DIR / f"save_{player.player_id}.json"
        with open(filename, "w", encoding="utf-8") as fh:
            json.dump(payload, fh, indent=2)
        print(f"Saved checkpoint to {filename}")
        return filename

    @staticmethod
    def load_checkpoint(filepath: str):
        with open(filepath, "r", encoding="utf-8") as fh:
            return json.load(fh)


class Telemetry:
    LOG_FILE = Path("telemetry.log")

    @staticmethod
    def send(event_name: str, payload: dict):
        entry = {
            "time": datetime.utcnow().isoformat() + "Z",
            "event": event_name,
            "payload": payload,
        }
        with open(Telemetry.LOG_FILE, "a", encoding="utf-8") as fh:
            fh.write(json.dumps(entry) + "\n")
        print(f"Telemetry: {event_name} -> {payload}")


# --- Hospital & Medkit logic -----------------------------------------------

class HospitalManager:
    @staticmethod
    def enter_hospital(player: Player, reason: str = "injury"):
        player.is_hospitalized = True
        event = {"time": datetime.utcnow().isoformat() + "Z", "event": "hospital_enter", "reason": reason}
        player.choice_history.append(event)
        SaveManager.write_checkpoint(player, player.current_checkpoint)
        Telemetry.send("hospital_enter", {"player_id": player.player_id, "reason": reason})
        print("Player hospitalized. Options: use medkit / wait / revive_with_penalty")

    @staticmethod
    def exit_hospital(player: Player):
        player.is_hospitalized = False
        event = {"time": datetime.utcnow().isoformat() + "Z", "event": "hospital_exit"}
        player.choice_history.append(event)
        SaveManager.write_checkpoint(player, player.current_checkpoint)
        Telemetry.send("hospital_exit", {"player_id": player.player_id})
        print("Player exited hospital and returned to play.")


def use_medkit(player: Player, medkit: Medkit, buy_if_missing: bool = True):
    if medkit.hospital_only and not player.is_hospitalized:
        print("Medkit can only be used while hospitalized.")
        return False

    in_inventory = player.inventory.get(medkit.id, 0) > 0
    if not in_inventory:
        if buy_if_missing:
            if player.currency < medkit.cost:
                print("Not enough currency to buy medkit.")
                return False
            player.currency -= medkit.cost
            Telemetry.send("purchase", {"player_id": player.player_id, "item_id": medkit.id, "cost": medkit.cost})
            print(f"Bought medkit {medkit.name} for {medkit.cost} currency.")
        else:
            print("No medkit in inventory and buying is disabled.")
            return False
    else:
        player.remove_item(medkit.id, 1)
        print("Consumed medkit from inventory.")

    # Apply healing
    healed_to = int(player.max_health * medkit.heal_percent)
    player.health = max(player.health, healed_to)

    # Clear penalties
    if medkit.removes_penalties:
        # This is a placeholder for penalty-clearing logic
        print("Cleared hospitalization penalties (placeholder).")

    event = {
        "time": datetime.utcnow().isoformat() + "Z",
        "event": "hospital_medkit_use",
        "item_id": medkit.id,
        "cost": medkit.cost if not in_inventory else 0,
        "heal_percent": medkit.heal_percent,
        "result": "success",
    }
    player.choice_history.append(event)
    SaveManager.write_checkpoint(player, player.current_checkpoint)
    Telemetry.send("hospital_medkit_use", {"player_id": player.player_id, "item_id": medkit.id, "cost": event["cost"]})

    HospitalManager.exit_hospital(player)
    return True


# --- Example run -----------------------------------------------------------

if __name__ == "__main__":
    # Default medkit values (designer-tuned): cost=50, heal_percent=0.8
    standard_medkit = Medkit("medkit_standard", "Standard Medkit", cost=50, heal_percent=0.8)

    p = Player()
    print(f"New player id={p.player_id} currency={p.currency} health={p.health}")

    # Simulate getting hospitalized
    HospitalManager.enter_hospital(p, reason="critical_damage")

    # Attempt to use medkit (player has none => will buy)
    ok = use_medkit(p, standard_medkit, buy_if_missing=True)
    print("Medkit used?", ok)
    print(f"After medkit: health={p.health} currency={p.currency} inventory={p.inventory}")

    # Simulate hospitalization without enough funds
    p.currency = 10
    HospitalManager.enter_hospital(p, reason="fall")
    ok2 = use_medkit(p, standard_medkit, buy_if_missing=True)
    print("Medkit used when low funds?", ok2)

    print("Final save written at:")
    for f in SaveManager.SAVE_DIR.glob("save_*.json"):
        print(" -", f)
