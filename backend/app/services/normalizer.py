import re
import json
from pathlib import Path
from typing import Dict, List, Set, Tuple, Optional
from app.core.config import settings

class NormalizerService:
    def __init__(self, dict_dir: Optional[Path] = None):
        self.dict_dir = dict_dir or settings.DICTIONARIES_DIR
        self.abbreviations: Dict[str, str] = {}
        self.misspellings: Dict[str, str] = {}
        self.unexpanded_acronyms: Set[str] = set()
        self._load_dictionaries()

    def _load_dictionaries(self) -> None:
        abbr_path = self.dict_dir / "abbreviations.json"
        if abbr_path.exists():
            with open(abbr_path, "r", encoding="utf-8") as f:
                self.abbreviations = json.load(f)

        misp_path = self.dict_dir / "misspellings.json"
        if misp_path.exists():
            with open(misp_path, "r", encoding="utf-8") as f:
                self.misspellings = json.load(f)

        unexp_path = self.dict_dir / "unexpanded_acronyms.json"
        if unexp_path.exists():
            with open(unexp_path, "r", encoding="utf-8") as f:
                unexp_list = json.load(f)
                self.unexpanded_acronyms = set(x.upper().strip() for x in unexp_list)

    def normalize_whitespace(self, text: str) -> str:
        if not text:
            return ""
        # Replace multiple spaces, tabs, and newlines with a single space
        return re.sub(r"\s+", " ", text).strip()

    def correct_misspellings(self, text: str) -> str:
        """Correct known domain misspellings while preserving word boundaries."""
        if not text or not self.misspellings:
            return text
        
        words = text.split()
        corrected = []
        for word in words:
            # Strip punctuation for lookup
            clean_word = re.sub(r"^[^\w]+|[^\w]+$", "", word).upper()
            if clean_word in self.misspellings:
                replacement = self.misspellings[clean_word]
                # Re-attach any leading or trailing punctuation
                prefix = word[:len(word) - len(word.lstrip(".,;:!?()\"'-"))]
                suffix = word[len(word.rstrip(".,;:!?()\"'-")):]
                corrected.append(f"{prefix}{replacement}{suffix}")
            else:
                corrected.append(word)
        return " ".join(corrected)

    def expand_abbreviations_conservative(self, text: str) -> str:
        """
        Expands abbreviations conservatively.
        Guards against expanding ambiguous or unexpanded technical acronyms (CHT, EGT, FOD, etc.).
        """
        if not text or not self.abbreviations:
            return text

        words = text.split()
        expanded = []
        for word in words:
            clean_word = re.sub(r"^[^\w/&#]+|[^\w/&#]+$", "", word).upper()
            
            # Guard against unexpanded technical terms
            if clean_word in self.unexpanded_acronyms:
                expanded.append(word)
                continue

            if clean_word in self.abbreviations:
                replacement = self.abbreviations[clean_word]
                prefix = word[:len(word) - len(word.lstrip(".,;:!?()\"'-"))]
                suffix = word[len(word.rstrip(".,;:!?()\"'-")):]
                expanded.append(f"{prefix}{replacement}{suffix}")
            else:
                expanded.append(word)
        return " ".join(expanded)

    def clean_record_text(self, problem: str, action: str) -> Tuple[str, str, str]:
        """
        Cleans problem and action text into normalized search forms,
        while never modifying the raw verbatim text stored separately.
        """
        prob_norm = self.normalize_whitespace(problem or "")
        act_norm = self.normalize_whitespace(action or "")

        # Correct misspellings first
        prob_clean = self.correct_misspellings(prob_norm)
        act_clean = self.correct_misspellings(act_norm)

        # Merge for search and embedding representation
        combined_clean = f"{prob_clean} {act_clean}".strip()
        return prob_clean, act_clean, combined_clean

    def extract_component_tag(self, text: str) -> str:
        """Classify maintenance record into standard aircraft subsystems."""
        t = text.upper()
        if "BAFFLE" in t or "BAFFLING" in t:
            return "ENGINE BAFFLE"
        elif "INTAKE" in t or "INDUCTION" in t or "GASKET" in t:
            if "ROCKER" in t:
                return "ROCKER BOX / COVER"
            return "INTAKE SYSTEM"
        elif "ROCKER" in t or "VALVE COVER" in t:
            return "ROCKER BOX / COVER"
        elif "CYL" in t or "CYLINDER" in t or "PISTON" in t:
            return "CYLINDER & PISTON"
        elif "VALVE" in t or "PUSH ROD" in t or "TAPPET" in t:
            return "VALVE TRAIN"
        elif "OIL" in t or "COOLER" in t or "DIPSTICK" in t or "SUMP" in t:
            return "OIL & LUBRICATION"
        elif "MAG" in t or "MAGNETO" in t or "IGNITION" in t or "PLUG" in t:
            return "IGNITION & MAGNETO"
        elif "FUEL" in t or "SERVO" in t or "INJECTOR" in t or "CARB" in t:
            return "FUEL & INDUCTION"
        elif "PROP" in t or "PROPELLER" in t or "GOVERNOR" in t:
            return "PROPELLER & GOVERNOR"
        elif "COWL" in t or "FIREWALL" in t or "NACELLE" in t or "MOUNT" in t:
            return "AIRFRAME & COWLING"
        elif "ALT" in t or "ALTERNATOR" in t or "BATTERY" in t or "WIRE" in t:
            return "ELECTRICAL SYSTEM"
        elif "IDLE" in t or "RPM" in t or "THROTTLE" in t or "MIXTURE" in t:
            return "ENGINE CONTROLS"
        else:
            return "GENERAL ENGINE / AIRFRAME"

    def extract_action_type(self, text: str) -> str:
        """Classify maintenance action performed into standard action types."""
        t = text.upper()
        if "REMOVED & REPLACED" in t or "REMOVED AND REPLACED" in t or "R&R" in t or "REPLACED" in t:
            return "REMOVED & REPLACED"
        elif "STOP DRILLED" in t or "STOP DRILL" in t:
            return "STOP-DRILLED"
        elif "PATCH" in t or "FABRICATED" in t or "DOUBLER" in t:
            return "FABRICATED PATCH"
        elif "TIGHTENED" in t or "TORQUED" in t or "RETORQUED" in t or "SECURED" in t:
            return "TIGHTENED / TORQUED"
        elif "REAMED" in t or "REAM" in t:
            return "REAMED VALVE GUIDE"
        elif "ADJUSTED" in t or "RERIGGED" in t or "RIGGED" in t:
            return "ADJUSTED / RIGGED"
        elif "CLEANED" in t or "WASHED" in t:
            return "CLEANED"
        elif "INSPECTED" in t or "CHECKED" in t or "OPS CHECK" in t:
            return "INSPECTED / TESTED"
        else:
            return "MAINTENANCE ACTION"

normalizer = NormalizerService()
