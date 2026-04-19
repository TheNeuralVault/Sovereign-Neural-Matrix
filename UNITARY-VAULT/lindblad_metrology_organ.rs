pub struct LindbladMetrology;
impl LindbladMetrology {
    pub fn new() -> Self { Self }
    pub fn measure_fidelity(&self, noise: f64) -> f64 { 1.0 - noise }
}
