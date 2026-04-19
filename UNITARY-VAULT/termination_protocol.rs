pub struct KillSwitch { pub min_fidelity: f64, pub entropy_ceiling: f64 }
impl KillSwitch {
    pub fn new() -> Self { Self { min_fidelity: 0.95, entropy_ceiling: 0.05 } }
    pub fn audit_system(&self, fidelity: f64) -> bool {
        let current_noise = 1.0 - fidelity;
        if fidelity > 1.0 || fidelity < self.min_fidelity || current_noise > self.entropy_ceiling {
            println!("[TERMINATION] NOISE ({:.4}) EXCEEDS CEILING ({:.4})", current_noise, self.entropy_ceiling);
            false 
        } else {
            true
        }
    }
}
