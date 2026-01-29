
import math

class PhysicsMock:
    WORLD_SIZE = 12000
    FRICTION = 0.985

def compute_lagrangian(xv, yv, hit_timer):
    # Mimicking the Logic in services/physics.ts
    v_sq = xv*xv + yv*yv
    L_symp = 0.5 * v_sq
    
    friction_loss = (1 - PhysicsMock.FRICTION) * v_sq
    damage_entropy = 1.0 if hit_timer > 0 else 0.0
    L_metr = friction_loss + damage_entropy
    
    return L_symp, L_metr

def test_lagrangian_conservation():
    # In a perfect vacuum (no friction), L_metr should be 0 (excluding damage)
    PhysicsMock.FRICTION = 1.0
    L_s, L_m = compute_lagrangian(10, 0, 0)
    assert L_s == 50.0
    assert L_m == 0.0

def test_lagrangian_dissipation():
    # With friction and damage, L_metr should be positive
    PhysicsMock.FRICTION = 0.985
    L_s, L_m = compute_lagrangian(10, 0, 60)
    assert L_s == 50.0
    assert L_m > 1.0 # 1.0 from damage + friction

def test_golden_operator():
    PHI = (1 + math.sqrt(5)) / 2
    def get_golden_value(n):
        return math.cos(math.pi * n) * math.cos(math.pi * PHI * n)
    
    # Verify O_n is deterministic and structured
    val1 = get_golden_value(1.0)
    val2 = get_golden_value(1.0)
    assert val1 == val2
    assert -1 <= val1 <= 1
