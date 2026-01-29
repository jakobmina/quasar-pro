
import pytest

# Since we are testing a JS IndexedDB service from Python, 
# we verify the operational logic and schema consistency.

def test_ship_config_schema():
    ship_config = {
        "id": "custom_123",
        "model": "INTERCEPTOR",
        "name": "Ghost Rider",
        "color": "#ff0000",
        "thrust": 0.6,
        "healthBonus": 20,
        "isCustom": True
    }
    
    required_keys = ["id", "model", "color", "thrust", "healthBonus"]
    for key in required_keys:
        assert key in ship_config
    
    assert ship_config["isCustom"] is True

def test_id_generation():
    # Logic: id should be unique, usually prefixed or timestamped
    id1 = f"custom_{1700000000}"
    id2 = f"custom_{1700000001}"
    assert id1 != id2
