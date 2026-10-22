import pytest
from app.services.normalizer import NormalizerService

@pytest.fixture
def normalizer():
    return NormalizerService()

def test_normalize_whitespace(normalizer):
    text = "  ENGINE   IDLE   OVERRIDE \n\t KILLED ENGINE.  "
    assert normalizer.normalize_whitespace(text) == "ENGINE IDLE OVERRIDE KILLED ENGINE."

def test_correct_misspellings(normalizer):
    text = "ACCESORY DRIVE AND ALVE COVER WERE ASSEBLED PROPERLY"
    corrected = normalizer.correct_misspellings(text)
    assert "ACCESSORY" in corrected
    assert "VALVE" in corrected
    assert "ASSEMBLED" in corrected

def test_expand_abbreviations_conservative(normalizer):
    text = "L/H ENG #2 CYL INTAKE LEAKS"
    expanded = normalizer.expand_abbreviations_conservative(text)
    assert "LEFT-HAND" in expanded or "LEFT" in expanded
    assert "ENGINE" in expanded
    assert "CYLINDER" in expanded

def test_unexpanded_acronym_safety(normalizer):
    # Safety critical acronyms (CHT, EGT, FOD, AD) must NEVER be rewritten
    text = "CHECKED CHT AND EGT FOR FOD ACCORDING TO AD"
    expanded = normalizer.expand_abbreviations_conservative(text)
    assert "CHT" in expanded
    assert "EGT" in expanded
    assert "FOD" in expanded
    assert "AD" in expanded

def test_extract_component_tag(normalizer):
    assert normalizer.extract_component_tag("CYLINDER #2 EXHAUST VALVE STUCK") == "CYLINDER & PISTON"
    assert normalizer.extract_component_tag("R/H AFT BAFFLE CRACKED") == "ENGINE BAFFLE"
    assert normalizer.extract_component_tag("#4 INTAKE GASKET LEAKING") == "INTAKE SYSTEM"
    assert normalizer.extract_component_tag("OIL PRESSURE TRANSDUCER LEAKING") == "OIL & LUBRICATION"

def test_extract_action_type(normalizer):
    assert normalizer.extract_action_type("REMOVED & REPLACED GASKET") == "REMOVED & REPLACED"
    assert normalizer.extract_action_type("STOP DRILLED CRACK") == "STOP-DRILLED"
    assert normalizer.extract_action_type("REAMED EXHAUST VALVE GUIDE") == "REAMED VALVE GUIDE"
    assert normalizer.extract_action_type("TIGHTENED CLAMPS") == "TIGHTENED / TORQUED"
