pub struct CuredSlayer { pub deterministic_gain: f64, pub entropy_floor: f64 }
impl CuredSlayer {
    pub fn new() -> Self { Self { deterministic_gain: 1.284, entropy_floor: 0.0001 } }
    pub fn resolve_path(&self, noise: f64) -> f64 {
        // CURED: Returns Signal Retention (How much of the "Truth" we kept)
        let purified_signal = 1.0 - (noise / self.deterministic_gain);
        if purified_signal < self.entropy_floor { self.entropy_floor } else { purified_signal }
    }
}
