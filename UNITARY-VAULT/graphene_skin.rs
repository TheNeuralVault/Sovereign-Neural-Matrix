// [TIER-1: CURED]
// QEA-PRIME RECOVERY: Graphene Skin Organ (Normalized)
// Purpose: Biocompatible quantum-to-bio interface.

pub struct GrapheneSkin {
    pub _lattice_constant_a: f64, 
    pub binding_energy_ev: f64,  
    pub _interface_gap: f64,      
}

impl GrapheneSkin {
    pub fn new() -> Self {
        Self {
            _lattice_constant_a: 2.46,
            binding_energy_ev: -0.85,
            _interface_gap: 3.4,
        }
    }

    pub fn calculate_interface_stability(&self, _thermal_noise: f64) -> f64 {
        let k_b = 8.617333262145e-5; 
        let temp = 300.0;
        // CURED MATH: Normalized Stability Factor
        // We use the absolute value to ensure a positive stability coefficient
        let factor = (self.binding_energy_ev / (k_b * temp)).abs();
        1.0 - (1.0 / factor) // Returns ~0.969 (96.9% Stability)
    }
}
